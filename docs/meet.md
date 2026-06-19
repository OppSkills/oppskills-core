# Meet Feature — End-to-End Guide

This doc explains how video meetings work in OppSkills: creating a meet, who can join, how LiveKit handles the actual call, and where each piece of code lives.

---

## What it does

Users can:

- Start an **instant** video call and share a link
- Create an **open link** meet (reusable link, no fixed start time)
- **Schedule** a meet for a future date/time
- Join via invite code or full URL (`meet.oppskills.com/{inviteCode}`)
- Use mic, camera, screen share, hand raise, reactions, and in-room text chat
- Create meets from two places:
  - **Standalone** — `meet-webapp` landing page (personal meets, open to anyone signed in)
  - **Community** — community manage dashboard (restricted audience options)

Meet is a **separate Next.js app** (`apps/meet-webapp`, port 3003). The main dashboard (`ui-webapp`) only schedules community meets. The actual call UI runs on the meet app.

---

## Big picture

```
┌─────────────────────┐     ┌─────────────────────┐
│  ui-webapp (:3000)  │     │ meet-webapp (:3003) │
│  Community manage   │     │ Landing + call room │
│  MeetScheduler      │     │ /{inviteCode}       │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           │  REST + Clerk JWT         │
           └───────────┬───────────────┘
                       ▼
           ┌───────────────────────┐
           │  NestJS backend (:3001) │
           │  MeetService          │
           │  - create meet row    │
           │  - check permissions  │
           │  - issue LiveKit JWT  │
           └───────────┬───────────┘
                       │
           ┌───────────┴───────────┐
           ▼                       ▼
    PostgreSQL              LiveKit Cloud
    community_meet          WebRTC media
    (metadata only)         (audio/video/data)
```

**Important split:** OppSkills backend stores meet **metadata** (title, host, invite code, access rules). **LiveKit** handles all real-time media (WebRTC). The backend never proxies video streams.

---

## Apps and URLs

| App | Port (dev) | Production URL | Role |
|-----|------------|----------------|------|
| `meet-webapp` | 3003 | `meet.oppskills.com` | Join page, lobby, video room |
| `ui-webapp` | 3000 | main app | Community meet scheduler |
| `backend` | 3001 | `api.oppskills.com` | Create meets, auth, LiveKit tokens |

Meet links look like: `https://meet.oppskills.com/{inviteCode}`

Env vars:

- Backend: `MEET_BASE_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`
- Frontend: `NEXT_PUBLIC_MEET_BASE_URL`, `NEXT_PUBLIC_API_URL`

---

## Database (`community` schema)

Table: `community_meet` (`CommunityMeetEntity`)

| Column | Purpose |
|--------|---------|
| `inviteCode` | Unique short code in the URL (random base64url, 8 chars) |
| `livekitRoomName` | LiveKit room name, format `meet-{inviteCode}` |
| `communityId` | `null` for personal meets; set for community meets |
| `kind` | `INSTANT`, `OPEN_LINK`, or `SCHEDULED` |
| `title`, `description` | Display info |
| `scheduledStartAt` | Set for scheduled meets; set to `now` for instant |
| `audienceScope` | `ALL` or `MEMBER_TYPES` |
| `audienceFilter` | Which community segment can join (when restricted) |
| `hostUserId` | Creator |
| `status` | `ACTIVE`, `SCHEDULED`, or `ENDED` |

### Meet kinds

| Kind | What happens on create | Typical use |
|------|------------------------|-------------|
| **INSTANT** | `status = ACTIVE`, `scheduledStartAt = now` | Start call immediately |
| **OPEN_LINK** | `status = ACTIVE`, no scheduled time | Share a link, join whenever |
| **SCHEDULED** | `status = SCHEDULED`, `scheduledStartAt` required | Future meeting |

On first join, a `SCHEDULED` meet flips to `ACTIVE`.

### Status `ENDED`

The schema supports `ENDED` and join is blocked if status is `ENDED`. There is no "end meet" API yet — nothing in the codebase sets this today.

---

## REST API

All endpoints require Clerk auth (`Authorization: Bearer`).

### Personal meets (`/meets`)

| Method | Path | What it does |
|--------|------|----------------|
| POST | `/meets` | Create personal meet (`communityId = null`, audience `ALL`) |
| GET | `/meets/my` | List meets you hosted |
| GET | `/meets/:inviteCode` | Lobby preview (title, host, permissions check) |
| POST | `/meets/:inviteCode/token` | Issue LiveKit join token |

### Community meets (`/communities/:communityId/meets`)

| Method | Path | What it does |
|--------|------|----------------|
| POST | `/communities/:id/meets` | Create community meet |
| GET | `/communities/:id/meets` | List meets for that community |

Create body (`CreateCommunityMeetDto`):

```json
{
  "kind": "INSTANT",
  "title": "Weekly sync",
  "description": "optional",
  "scheduledStartAt": "2026-05-31T14:00:00.000Z",
  "audienceScope": "MEMBER_TYPES",
  "audienceFilter": "Community Roster"
}
```

---

## Who can create a meet

| Context | Who can create |
|---------|----------------|
| Personal (`POST /meets`) | Any signed-in user |
| Community (`POST /communities/:id/meets`) | Community owner, or member with role `ADMIN` or `MODERATOR` |

---

## Who can join a meet

Checked in `assertCanJoinMeet` before preview or token:

1. Meet must not be `ENDED`
2. **Personal meet** (`communityId = null`) or `audienceScope = ALL` → any signed-in user
3. **Community meet with restrictions** → must pass one of:
   - You are the host
   - You are the community owner
   - You are a community member matching `audienceFilter`

### Audience filters (community meets)

When `audienceScope = MEMBER_TYPES`, `audienceFilter` picks a segment:

| Filter value | Who matches |
|--------------|-------------|
| `Community Roster` (default) | Members except `FOLLOWER` role |
| `Followers` | Members with `FOLLOWER` access role |
| `Internal Members` | Non-follower members |
| Custom role name | Members whose `role` field matches (case-insensitive) |

Same logic as community notification audiences (`buildCommunityAudienceWhere`).

Frontend maps this as:

- **"Community members only"** → `MEMBER_TYPES` + selected filter
- **"Open to all"** → `ALL` (anyone with link who is signed in)

---

## Flow: create a meet

```
1. User fills form (meet-webapp landing OR ui-webapp MeetScheduler)
2. POST /meets OR POST /communities/:id/meets
3. Backend:
   - Generate unique inviteCode (retry up to 5 random candidates)
   - Set livekitRoomName = "meet-{inviteCode}"
   - Insert community_meet row
4. Response includes meetUrl = {MEET_BASE_URL}/{inviteCode}
5. UI shows link dialog (copy / open in new tab)
```

No LiveKit room is created explicitly at this step. LiveKit creates the room when the first participant connects with a valid token.

---

## Flow: join a meet

```
1. User opens meet.oppskills.com/{inviteCode}
2. Clerk sign-in if needed
3. GET /meets/:inviteCode → preview (title, host, community name)
   - Backend runs assertCanJoinMeet (403 if not allowed)
4. Lobby UI:
   - Camera/mic preview via getUserMedia
   - Toggle mic/camera before joining
5. User clicks "Join meeting"
6. POST /meets/:inviteCode/token
   - Backend checks join permission again
   - Builds LiveKit AccessToken (JWT, 6h TTL):
       identity = user.id
       name = user's display name
       grant: roomJoin, canPublish, canSubscribe, canPublishData
       room = meet.livekitRoomName
   - If status was SCHEDULED → update to ACTIVE
7. Frontend mounts <LiveKitRoom token serverUrl connect>
8. WebRTC connection to LiveKit — audio/video flows peer-to-server
```

There is no OppSkills WebSocket for meets. After step 7, everything is LiveKit.

---

## In-room features (meet-webapp)

Built with `@livekit/components-react` and `livekit-client`.

| Feature | How it works |
|---------|----------------|
| Video grid / speaker layout | `VideoStage` + `useParticipants`, `useTracks` |
| Mic / camera toggle | `useLocalParticipant` |
| Screen share | `localParticipant.setScreenShareEnabled` |
| Participant list | `MeetSidebar` — sorted, host pinned top |
| In-room chat | LiveKit built-in `useChat()` (not OppSkills chat DB) |
| Hand raise | `publishData` JSON `{ type: "hand", raised: true/false }` |
| Reactions | `publishData` JSON `{ type: "reaction", emoji }` |
| Leave | Disconnect room → "You left the meeting" screen |

Hand raise and reactions use LiveKit **data channels**, not the NestJS API.

---

## LiveKit token details

Generated in `MeetService.createJoinToken`:

```typescript
const grant = {
  roomJoin: true,
  room: meet.livekitRoomName,  // e.g. "meet-abc123XY"
  canPublish: true,
  canSubscribe: true,
  canPublishData: true,
};
// JWT signed with LIVEKIT_API_SECRET, ttl 6h
```

The client connects to `LIVEKIT_URL` (e.g. `wss://your-project.livekit.cloud`) with this token. LiveKit validates it — the OppSkills backend is not in the media path.

---

## Frontend structure

### meet-webapp (`apps/meet-webapp/`)

```
src/app/page.tsx                    Landing (create + join by code)
src/app/[inviteCode]/page.tsx       Meet join route
src/app/[inviteCode]/MeetPageClient.tsx   Lobby → room state machine
src/components/meet/
  MeetRoom.tsx                      LiveKitRoom wrapper
  VideoStage.tsx                    Grid, screen share, pagination
  MeetControlBar.tsx                Mic, cam, screen share, leave
  MeetSidebar.tsx                   Participants + in-room chat
  MeetHeader.tsx                    Layout toggle
src/lib/api/meetApi.ts              POST /meets, preview, token
src/components/landing/MeetLanding.tsx
```

### ui-webapp (community scheduling only)

```
src/app/dashboard/community/manage/_components/
  MeetScheduler.tsx       Create instant / link / scheduled meets
  MeetLinkDialog.tsx      Copy link after create
src/lib/api/communityMeetApi.ts   Community meet CRUD + shared preview/token calls
```

---

## Backend structure

```
apps/backend/src/meet/
  meet.module.ts
  meet.controller.ts              Personal meets + preview + token
  community-meet.controller.ts    Community create + list
  meet.service.ts                 All business logic + LiveKit tokens
  dto/create-community-meet.dto.ts
```

Shared types: `packages/types/src/dtos/backend/community/community-meet.dto.ts`

Audience helper: `apps/backend/src/notification/community-audience.util.ts`

---

## Personal vs community meet

| | Personal | Community |
|---|----------|-----------|
| Create endpoint | `POST /meets` | `POST /communities/:id/meets` |
| `communityId` | `null` | Set |
| Default audience | `ALL` | `MEMBER_TYPES` |
| Who can join | Any signed-in user | Filtered by audience rules |
| UI | `meet-webapp` landing | `ui-webapp` MeetScheduler |
| Join UI | Same meet-webapp `/{inviteCode}` | Same |

Both types share the same join flow and LiveKit room mechanics.

---

## Design choices

1. **Separate meet app** — Video calls get their own deploy (Vercel: `deploy-meet-webapp-vercel.yml`), domain, and bundle. Main app stays light.

2. **Backend as gatekeeper, LiveKit as media server** — OppSkills only issues short-lived JWTs after permission checks. No WebRTC through your API. Standard pattern (same idea as Zoom/Meet token servers).

3. **Invite code in URL, not room name** — Users share human-friendly codes. `livekitRoomName` is derived (`meet-{code}`) and never exposed in the UI.

4. **Auth on every step** — Preview and token both call `assertCanJoinMeet`. You cannot skip the lobby permission check by hitting LiveKit directly without a token.

5. **Audience reuse** — Meet access filters reuse the same `buildCommunityAudienceWhere` logic as community notifications. One definition of "Community Roster" everywhere.

6. **In-room chat ≠ platform chat** — Meet sidebar chat is LiveKit's ephemeral room chat. It is not stored in the `chat` schema and disappears when the room empties.

7. **SCHEDULED → ACTIVE on first join** — No cron job needed. First person requesting a token activates the meet.

8. **Monorepo shared types** — `@oppskills/types` keeps create/preview/token DTOs in sync across backend, meet-webapp, and ui-webapp.

---

## What is not built yet

- End meet API (`ENDED` status exists but is never set)
- Email notifications for scheduled meets (UI shows "coming soon" toast)
- Recording
- Waiting room / knock to join
- Host mute/remove participant (LiveKit supports it; UI may be partial)

---

## Local dev quick reference

```bash
docker compose up -d          # Postgres (Redis optional for other features)
pnpm dev:backend              # :3001
pnpm dev:meet-webapp          # :3003

# LiveKit — required for actual calls
# Set in apps/backend/.env.local:
# LIVEKIT_API_KEY=...
# LIVEKIT_API_SECRET=...
# LIVEKIT_URL=wss://...
```

1. Open `http://localhost:3003`, sign in, create instant meet
2. Copy link, open in another browser/profile
3. Both users need Clerk accounts for personal meets; community meets need membership

---

## File map (start here when debugging)

| Area | Path |
|------|------|
| Prisma schema | `packages/database/prisma/schemas/community.prisma` |
| Create + token logic | `apps/backend/src/meet/meet.service.ts` |
| REST routes | `apps/backend/src/meet/meet.controller.ts`, `community-meet.controller.ts` |
| Lobby + join flow | `apps/meet-webapp/src/app/[inviteCode]/MeetPageClient.tsx` |
| Video room | `apps/meet-webapp/src/components/meet/MeetRoom.tsx` |
| Community scheduler | `apps/ui-webapp/.../MeetScheduler.tsx` |
| Shared DTOs | `packages/types/src/dtos/backend/community/community-meet.dto.ts` |
