# Chat Feature — End-to-End Guide

This doc explains how chat works in OppSkills: what gets stored, how messages move from browser to database, and how real-time updates reach other users. 

---

## What it does

Users can:

- Start a **1:1 (direct) chat** with another platform user
- Create **group chats** with a name, optional handle, and members
- Send **text**, **images**, **videos**, and **documents**
- Reply to a specific message
- See **online / last seen** for people they share a chat with
- See **sent vs delivered** on their own outgoing messages
- Search chats and users
- View shared media/documents in a sidebar
- Delete a chat from their inbox, leave a group, or (admin) delete the whole group

Chat lives at `/dashboard/chats` in the Next.js app. The API is under `/chats` on the NestJS backend (port 3001).

---

## Big picture

```
Browser (Next.js)
  │
  ├─ REST (Axios + Clerk JWT)     → load inbox, history, search, mark read
  │
  ├─ WebSocket (Socket.IO /chat)  → send messages, live updates, presence
  │
  └─ Direct S3 upload             → attachments (presigned URL from /media)

NestJS backend
  ├─ ChatController        REST endpoints
  ├─ ChatGateway           Socket.IO namespace /chat
  ├─ Services              conversations, messages, groups, attachments, search
  ├─ PostgreSQL (chat schema)  durable storage
  └─ Redis                   presence + Socket.IO adapter (multi-instance)

S3 (private/chat-attachments)
  └─ Files uploaded by client; served back through authenticated backend stream
```

**Two channels on purpose:**

| Channel | Used for |
|---------|----------|
| **REST** | Initial load, pagination, search, group admin actions, attachment download |
| **WebSocket** | New messages, inbox preview updates, delivery receipts, presence |

If WebSocket send fails (timeout / disconnected), the client falls back to REST `POST /chats/conversations/:id/messages`.

---

## Database (`chat` schema)

All tables live in PostgreSQL schema `chat` (see `packages/database/prisma/schemas/chat.prisma`).

### Core tables

| Table | Purpose |
|-------|---------|
| `conversation` | A DM or group. Has `type`, `name`, `handle`, `lastMessageAt`. |
| `conversation_participant` | Who is in the chat. `lastReadAt` for unread count. `leftAt` when user hides/leaves. |
| `conversation_direct_key` | Ensures one DM per user pair (`userLowId` + `userHighId` sorted). |
| `message` | Text body, type, optional `replyToMessageId`. |
| `message_attachment` | File metadata + S3 URL for IMAGE / VIDEO / DOCUMENT. |
| `message_delivery` | One row per (message, recipient) when that recipient received it. |

### Conversation types

- **DIRECT** — exactly two participants. Name comes from the other person's profile.
- **GROUP** — many participants. Creator (`createdById`) is the admin.

### Message types

`TEXT`, `IMAGE`, `VIDEO`, `DOCUMENT`, `SYSTEM` (e.g. "Alice left the group").

### How DMs stay unique

When user A opens a chat with user B, the backend sorts their IDs into `low` and `high` and looks up `conversation_direct_key`. If it exists, reuse that conversation. If not, create a new one with both participants.

This avoids duplicate DM threads between the same two people.

### Soft delete vs hard delete

- **Delete chat (inbox)** — sets `leftAt` on the participant row. Chat disappears from your list; messages stay in DB.
- **New message to a "deleted" chat** — `restoreConversationForParticipants` clears `leftAt` for everyone, so the chat reappears.
- **Delete group (admin)** — removes the whole conversation from DB for everyone.

---

## Authentication

Same as the rest of the app: **Clerk JWT**.

- **REST**: `Authorization: Bearer <token>` via `ClerkAuthGuard`
- **WebSocket**: token in `socket.handshake.auth.token` (or Bearer header). Verified with Clerk on connect. Rejected connections are disconnected.

**Special case — video playback:** HTML `<video>` cannot send custom headers. So:

1. Client calls `GET .../stream-token` with Clerk JWT → gets a short-lived JWT (15 min)
2. Video `src` uses `GET .../attachment?streamToken=...&disposition=inline`
3. `ClerkAuthGuard` accepts that stream token instead of Clerk for attachment routes only

Attachments are **not** public CDN URLs. Even though S3 stores the file, the browser loads them through the backend, which checks you are a participant.

---

## REST API (main endpoints)

Base path: `/chats`. All require auth.

| Method | Path | What it does |
|--------|------|----------------|
| GET | `/conversations` | Inbox list, cursor-paginated by `lastMessageAt` |
| GET | `/search?q=` | Search your conversations + platform users |
| POST | `/conversations/direct` | Get or create DM (`otherUserId`) |
| POST | `/conversations/group` | Create group |
| GET | `/conversations/:id` | Conversation metadata + members |
| GET | `/conversations/:id/messages` | Message history (`before` / `after` cursors) |
| POST | `/conversations/:id/messages` | Send message (REST fallback) |
| POST | `/conversations/:id/read` | Set `lastReadAt` = now |
| POST | `/conversations/:id/delivered` | Ack delivery (REST alternative to WS) |
| GET | `.../messages/:messageId/attachment` | Stream file (supports Range for video) |
| GET | `.../messages/:messageId/thumbnail` | Video thumbnail |
| GET | `.../messages/:messageId/stream-token` | Token for `<video>` |
| DELETE | `/conversations/:id` | Hide chat for current user |
| POST | `/conversations/:id/leave` | Leave group (not admin) |
| DELETE | `/conversations/:id/group` | Admin deletes group for all |

---

## WebSocket (`/chat` namespace)

Client: `socket.io-client` connecting to `{API_URL}/chat`.

### Connection lifecycle

1. Connect with Clerk token
2. Server joins socket to room `user:{userId}` (for inbox-level events)
3. Client sends `presence_heartbeat` every 30s
4. When opening a thread, client emits `join_conversation` → room `conversation:{id}`

### Client → server events

| Event | Payload | Effect |
|-------|---------|--------|
| `join_conversation` | `{ conversationId }` | Join room after participant check |
| `leave_conversation` | `{ conversationId }` | Leave room |
| `send_message` | `{ conversationId, type, body, attachment?, replyToMessageId? }` | Save message, broadcast |
| `ack_delivered` | `{ conversationId, messageIds[] }` | Record delivery, notify senders |
| `presence_heartbeat` | — | Refresh Redis online TTL |

### Server → client events

| Event | When |
|-------|------|
| `message_created` | New message in a conversation you're in |
| `message_updated` | e.g. video thumbnail/duration ready after ffmpeg |
| `conversation_updated` | Inbox preview changed (last message, unread) |
| `messages_delivered` | Your outgoing message was delivered to everyone |
| `conversation_removed` | Chat removed from your inbox |
| `presence_updated` | Contact went online/offline |

### Redis adapter

If Redis is available, Socket.IO uses `@socket.io/redis-adapter`. That lets multiple backend instances share rooms — needed if you scale horizontally.

---

## Flow: sending a text message

```
1. User types and hits send
2. Frontend: join_conversation (if not already)
3. Frontend: emit send_message over WebSocket
4. Backend MessagesService:
   - assertParticipant(userId, conversationId)
   - sanitize HTML in body
   - INSERT message + UPDATE conversation.lastMessageAt (transaction)
   - restoreConversationForParticipants (un-hide for anyone who left)
5. ChatGateway.broadcastNewMessage:
   - emit message_created to conversation room + each participant's user room
   - emit conversation_updated with fresh inbox preview per user
6. Frontend useChatSocketSync receives message_created
   - Updates TanStack Query cache (applyChatEvent)
   - If chat is open and message is from someone else:
       emit ack_delivered + mark read via REST
```

If step 3 fails, same payload goes to `POST .../messages`.

---

## Flow: sending an attachment

Attachments never go through the WebSocket as binary. Flow:

```
1. Client shows optimistic message in UI (blob preview, upload %)
2. POST /media presign (purpose: CHAT_ATTACHMENT) → S3 presigned POST
3. Client uploads file directly to S3
4. Client sends message with attachment: { fileName, mimeType, sizeBytes, url, kind }
5. Message row + message_attachment row created
6. For VIDEO: backend runs ffmpeg async → thumbnail + duration → message_updated event
```

S3 path prefix: `private/chat-attachments/{userId}/...` — not world-readable.

---

## Read receipts vs delivery receipts

The app implements **delivery** (message reached recipient's client), not full "read" ticks like WhatsApp blue checks.

### Unread count (inbox badge)

```sql
COUNT messages WHERE
  conversationId = X
  AND senderId != me
  AND createdAt > my lastReadAt
```

`lastReadAt` updates when you open the chat (`POST .../read`).

### Delivery status (on your sent messages)

- **SENT** — not all other participants have acked yet
- **DELIVERED** — every active participant (except you) has a `message_delivery` row

Ack happens when:

- Recipient loads messages via REST (`listMessages` auto-acks), or
- Recipient gets `message_created` on open chat and emits `ack_delivered`

Sender sees update via `messages_delivered` WebSocket event.

---

## Presence (online / last seen)

Stored in **Redis**, not PostgreSQL.

| Key | Meaning |
|-----|---------|
| `chat:presence:online:{userId}` | TTL 90s; exists = online |
| `chat:presence:sockets:{userId}` | Hash of active socket IDs (supports multiple tabs) |
| `chat:presence:lastseen:{userId}` | ISO timestamp when last socket disconnected |

On connect: add socket, set online. On disconnect: if no sockets left, delete online key and set lastSeen.

`presence_updated` is only sent to users who share at least one active conversation (`getSharedContactUserIds`). You don't broadcast presence to the whole platform.

---

## Frontend structure

Location: `apps/ui-webapp/src/features/chat/`

```
api/chatApi.ts              REST wrappers
realtime/socket.ts          Socket.IO singleton + emit helpers
hooks/
  useChatPage.ts            Top-level orchestrator
  queries/                  TanStack Query (inbox, messages, search)
  mutations/                create chat, send (REST fallback), mark read
  send/useChatSendPipeline  Upload + optimistic UI + WS/REST send
  queries/useChatSocketSync Wire socket events → cache updates
  thread/useActiveThread    Join room, pagination, delivery acks
cache/
  reducer.ts                applyChatEvent — single place for cache mutations
  chatQueryKeys.ts          Query key factory
components/                 Sidebar, timeline, composer, attachments, group admin
pages/ChatsPageShell.tsx    Layout shell
```

**State management:** TanStack Query holds server state. Socket events and optimistic sends go through `applyChatEvent` so inbox + active thread stay in sync without refetching everything.

**Routes:**

- `/dashboard/chats` — inbox, no thread selected
- `/dashboard/chats/[id]` — inbox + active conversation

---

## Backend structure

Location: `apps/backend/src/chat/`

```
chat.module.ts
chat.controller.ts       REST
chat.gateway.ts          WebSocket
presence.service.ts      Redis presence
services/
  conversations.service.ts   inbox, DM create, mark read, delete
  messages.service.ts        send, list, delivery acks
  groups.service.ts          create/update/delete group, member removal
  chat-attachments.service.ts  stream from S3, gallery list
  chat-authorization.service.ts  participant + admin checks
  chat-search.service.ts
  chat.mapper.ts           DTO shaping (display names, etc.)
```

Shared types/DTOs: `packages/types/src/dtos/backend/chat/`.

---

## Authorization rules (short)

| Action | Rule |
|--------|------|
| View/send in conversation | Must be participant with `leftAt = null` |
| Update group image | Group admin only (`createdById`) |
| Remove member | Group admin only |
| Delete group | Group admin only |
| Leave group | Non-admin members only |
| Stream attachment | Participant check on every request |

---

## Design choices worth mentioning

1. **REST + WebSocket split** — REST for reliable reads and mutations; WS for low-latency push. Fallback to REST keeps send working when WS is down.

2. **Optimistic UI for attachments** — User sees the message immediately with a local blob URL; replaced with server message after S3 upload + send. Upload progress patched in cache.

3. **Private attachments via backend proxy** — S3 URLs are stored but not exposed as public links. Streaming goes through Nest with auth (or stream token for video tags). Supports HTTP Range for seeking in video.

4. **DM dedup via sorted user pair** — Simple, race-safe pattern with a unique constraint on `(userLowId, userHighId)`.

5. **Soft leave (`leftAt`)** — Per-user inbox hide without deleting history; new message restores the chat for everyone.

6. **Delivery ≠ read** — Cheaper to implement: delivery is automatic when messages are fetched or received live; read is just `lastReadAt` for unread badges.

7. **Redis for presence** — Ephemeral data doesn't belong in Postgres; TTL handles stale "online" if heartbeat stops.

8. **Monorepo shared types** — `@oppskills/types` keeps REST and WS payloads identical between backend and frontend.

---

## Local dev quick reference

```bash
docker compose up -d          # Postgres + Redis
pnpm dev:backend              # :3001
pnpm dev:ui-webapp            # :3000
```

Open `http://localhost:3000/dashboard/chats`. You need two logged-in users to test DMs. Redis is required for presence and recommended for Socket.IO scaling.

---

## File map (start here when debugging)

| Area | Path |
|------|------|
| Prisma schema | `packages/database/prisma/schemas/chat.prisma` |
| REST routes | `apps/backend/src/chat/chat.controller.ts` |
| WebSocket | `apps/backend/src/chat/chat.gateway.ts` |
| Send logic | `apps/backend/src/chat/services/messages.service.ts` |
| Frontend entry | `apps/ui-webapp/src/features/chat/hooks/useChatPage.ts` |
| Socket client | `apps/ui-webapp/src/features/chat/realtime/socket.ts` |
| Shared DTOs | `packages/types/src/dtos/backend/chat/` |
