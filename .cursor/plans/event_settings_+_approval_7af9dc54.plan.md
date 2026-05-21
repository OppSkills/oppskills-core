---
name: Event settings + approval
overview: Implement `/dashboard/events/[slug]/settings` plus a platform-wide publish→approval workflow (events/hackathons/festivals), including pause-registrations toggle and backend endpoints; admin UI deferred but endpoints provided.
todos:
  - id: prisma-approval-fields
    content: Add ApprovalStatus + approval fields across Event/Hackathon/Festival, plus Event.isRegistrationPaused.
    status: pending
  - id: backend-approval-endpoints
    content: Add submit-for-approval + admin approval endpoints for events/hackathons/festivals; enforce admin-only approval.
    status: pending
    dependencies:
      - prisma-approval-fields
  - id: backend-public-filters
    content: Filter public list endpoints to status=PUBLISHED and approvalStatus=APPROVED; enforce approval + pause in join flows.
    status: pending
    dependencies:
      - backend-approval-endpoints
  - id: reapproval-basic-info
    content: Implement re-approval reset on basic info edits (name/slug/description/banner/poster).
    status: pending
    dependencies:
      - backend-approval-endpoints
  - id: frontend-event-settings
    content: Build `/dashboard/events/[slug]/settings` UI with submit approval, pause registrations, status actions, and delete/cancel.
    status: pending
    dependencies:
      - backend-public-filters
  - id: frontend-nav-settings
    content: Add Settings entry to dashboard action menus linking to the new settings page.
    status: pending
    dependencies:
      - frontend-event-settings
---

# Event settings + publish→approval workflow

## Goal

1. Add an organizer-facing settings page at `/dashboard/events/[slug]/settings`.2) Implement a platform-wide **approval workflow** for **Events + Hackathons + Festivals**:

- Draft → “Submit for approval”
- Admin approves → item becomes publicly listed

3. Implement **Pause registrations** while remaining public (requires a dedicated flag).

## Confirmed decisions

- **Route**: `/dashboard/events/[slug]/settings` (matches existing dashboard convention).
- **Pause meaning**: Pause = **stop new registrations** while keeping the item publicly visible.
- **Approval model**: Keep lifecycle (`DRAFT`, `PUBLISHED`, `ONGOING`, `COMPLETED`, `CANCELLED`) and add **separate approval fields**.
- **Approval scope**: Apply to events + hackathons + festivals.
- **Admin UI**: Not in this rollout (backend endpoints only).
- **Re-approval policy**: Only re-approve on “major changes” = **basic info** (`name`, `slug`, `description`, banner/poster image).

## Why this requires backend work

- Public list endpoints (`GET /events`, `GET /hackathons`, `GET /festivals`) currently return **everything** (no status filtering). We must filter public results to **`status=PUBLISHED` AND `approvalStatus=APPROVED`**.
- There is no “pause registrations” boolean in Prisma; joining only checks status/deadline/capacity. We must add a flag and enforce it.

---

## Data model changes (Prisma)

File:

- [`packages/database/prisma/schema.prisma`](/Users/harshit/Documents/freelance/oppskills-core/packages/database/prisma/schema.prisma)

Add a new enum (or reuse across all):

- `ApprovalStatus`: `PENDING`, `APPROVED`, `REJECTED`

Add these fields to `EventEntity`, `HackathonEntity`, `FestivalEntity`:

- `approvalStatus ApprovalStatus @default(PENDING)`
- `approvalSubmittedAt DateTime?`
- `approvalApprovedAt DateTime?`
- `approvalRejectedAt DateTime?`
- `approvalNote String?` (optional: rejection reason / admin note)

Add to `EventEntity` (and optionally hackathon if it has a comparable “join” flow):

- `isRegistrationPaused Boolean @default(false) @map("is_registration_paused")`

## Types/DTO changes (`@oppskills/types`)

File (pattern; similar additions for hackathon/festival DTO files):

- [`packages/types/src/dtos/backend/event/create-event.dto.ts`](/Users/harshit/Documents/freelance/oppskills-core/packages/types/src/dtos/backend/event/create-event.dto.ts)

Add strict DTOs:

- `SubmitForApprovalDto` (optional: `note?: string`)
- `UpdateApprovalStatusDto` (`approvalStatus: "APPROVED" | "REJECTED"`, optional `note?: string`)
- `UpdateEventRegistrationPausedDto` (`isRegistrationPaused: boolean`)

Also update frontend-exported types (via `packages/types/src/frontend.ts`) if you expose these to UI.---

## Backend API changes (NestJS)

### Organizer actions

For each entity (events/hackathons/festivals):

- `POST /<entity>/:id/submit-approval`
- Permission: owner OR admin OR manager (match your existing event permission model; hackathon/festival may be owner/admin).
- Behavior:
  - Set `status` to `PUBLISHED` (if not already)
  - Set `approvalStatus` to `PENDING`
  - Set `approvalSubmittedAt = now()`
  - Clear `approvalApprovedAt/RejectedAt` as needed

### Admin actions (no UI yet)

For each entity:

- `PATCH /<entity>/:id/approval`
- Permission: **admin only** (use existing admin detection with `ADMIN_USER_IDS`)
- Body: `UpdateApprovalStatusDto`
- Behavior:
  - If approving: `approvalStatus=APPROVED`, set `approvalApprovedAt=now()`
  - If rejecting: `approvalStatus=REJECTED`, set `approvalRejectedAt=now()`, store optional note

### Pause registrations

For events:

- `PATCH /events/:id/registration`
- Permission: owner/admin/manager
- Body: `UpdateEventRegistrationPausedDto`
- Update `isRegistrationPaused`

### Enforcement in join flows

- Update `EventService.joinEvent()` to also reject when:
- `approvalStatus !== APPROVED`
- `isRegistrationPaused === true`

(And similarly for hackathon registration endpoints if they exist.)

### Public listing filters

Update the “public list” service methods so:

- `GET /events` returns only `status=PUBLISHED AND approvalStatus=APPROVED`
- `GET /hackathons` returns only `status=PUBLISHED AND approvalStatus=APPROVED`
- `GET /festivals` returns only `status=PUBLISHED AND approvalStatus=APPROVED`

Add a new authenticated “dashboard list” (optional if needed) that returns all for organizers/managers, OR keep existing `/my` endpoints unchanged.

### Re-approval on edits (only basic info)

When an already-approved entity changes any of:

- `name`, `slug`, `description`, banner/poster image

…automatically set:

- `approvalStatus = PENDING`, `approvalSubmittedAt = now()`, and clear approve/reject timestamps.

This can be done inside `updateEvent`, `updateHackathon`, `updateFestival` by diffing incoming DTO fields.---

## Frontend changes (settings page)

Files:

- `[apps/ui-landing/src/app/dashboard/events/[slug]/settings/page.tsx](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/settings/page.tsx)` (new)
- [`apps/ui-landing/src/lib/api/eventApi.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts) (add API wrappers)
- [`apps/ui-landing/src/app/dashboard/_components/ActionDropdown.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/_components/ActionDropdown.tsx) (add Settings link)

UI sections:

- **Approval**:
- Show `approvalStatus` badge (PENDING/APPROVED/REJECTED) + timestamps
- Primary button: **Submit for approval** (calls `POST /events/:id/submit-approval`)
- If `approvalStatus=REJECTED`, show admin note.
- **Visibility**:
- If already `APPROVED` and `status=PUBLISHED`, show “Live” state.
- Add “Unpublish” (sets status → DRAFT). If basic info hasn’t changed, approval may remain; when republishing, if `approvalStatus=APPROVED`, it becomes live immediately.
- **Registrations**:
- Toggle “Pause registrations” → `PATCH /events/:id/registration`
- **Danger zone**:
- Cancel (status → CANCELLED)
- Delete (DELETE /events/:id) with typed confirmation

## Documentation updates

- Update [`docs/api.md`](/Users/harshit/Documents/freelance/oppskills-core/docs/api.md) with:
- New approval fields in responses
- New submit-approval and approval endpoints
- Updated semantics for public listings and join constraints

---

## Verification checklist

- Submitting for approval sets `status=PUBLISHED` and `approvalStatus=PENDING`.
- Public list endpoints only show `PUBLISHED + APPROVED`.
- Joining an event fails when pending/rejected or paused.
