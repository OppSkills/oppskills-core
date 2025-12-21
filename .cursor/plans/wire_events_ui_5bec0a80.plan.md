---
name: Wire Events UI
overview: Connect the existing Events dashboard pages to the Events backend using the same Axios + Clerk + React Query patterns as Hackathons, replacing mock data and removing unsafe `any` usage.
todos:
  - id: types-export-events-frontend
    content: Export Event DTO types from packages/types/src/frontend.ts so ui-landing can import them without backend deps.
    status: pending
  - id: ui-event-api-client
    content: Replace eventApi.ts any-typed functions with strict typed functions (my/events/by-slug/roles add/remove) using @oppskills/types/frontend.
    status: pending
    dependencies:
      - types-export-events-frontend
  - id: ui-event-react-query-hooks
    content: Add useEventBySlug + useEventRoles hooks mirroring hackathon hooks, including role mutations + query invalidation.
    status: pending
    dependencies:
      - ui-event-api-client
  - id: ui-dashboard-events-list
    content: Update dashboard/events/page.tsx to call getMyEvents and parse response safely (no any), mapping fields like registrationCount and isOpen consistently.
    status: pending
    dependencies:
      - ui-event-api-client
  - id: ui-dashboard-events-roles
    content: Update dashboard/events/[slug]/manage-roles/page.tsx to use new hooks and remove all mock role data.
    status: pending
    dependencies:
      - ui-event-react-query-hooks
  - id: ui-api-client-root-normalization
    content: Update apiClient.ts knownResourceSuffixes to include /events for robust NEXT_PUBLIC_API_URL normalization.
    status: pending
---

# Connect Events dashboard to backend

## Goal

Wire `apps/ui-landing` Events dashboard (`/dashboard/events`) to the already-implemented Events backend endpoints, mirroring the Hackathon dashboard integration style (API client functions + React Query hooks + safe parsing).

## Decisions confirmed

- **Events list source**: Use `GET /events/my` (OWNER or MANAGER).
- **Owner filtering**: Do **not** filter down to owner-only; include manager events too.

## Key mismatches we must fix (important)

- `apps/ui-landing/src/lib/api/eventApi.ts` currently uses `any` for payloads, which violates your repo rules. We’ll replace with strict DTO types from `@oppskills/types/frontend`.
- `apps/ui-landing/src/lib/api/apiClient.ts` currently only strips `NEXT_PUBLIC_API_URL` suffixes `"/hackathons"` and `"/festivals"`; it should also understand `"/events"` so envs like `.../events` work.
- Several Events dashboard subpages are still mock-only (`edit-event`, `manage-roles`, `manage-registration`), while Hackathons have at least roles wired. We’ll prioritize wiring the same baseline: **list + roles**.

## Files to change

### 1) Export Event DTOs for frontend usage

File:

- [`/Users/harshit/Documents/freelance/oppskills-core/packages/types/src/frontend.ts`](../../../Users/harshit/Documents/freelance/oppskills-core/packages/types/src/frontend.ts)

Add type-only exports for:

- `CreateEventDto`, `UpdateEventDto`, `EventLocationDto`, `EventLifecycleStatusValue`
- `AddEventRoleDto`, `RemoveEventRoleDto`, `EventRolesResponse`, `EventUserRoleValue`

This enables strict typing in the Next.js app without importing NestJS-decorated classes at runtime.

### 2) Implement typed Events API client (like `hackathonApi.ts`)

File:

- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts`](../../../Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts)

Add/adjust functions:

- `getEvents(token)` (keep)
- `getMyEvents(token)` (new, calls `/my`)
- `getEventById(token, id)` (new)
- `getEventBySlug(token, slug)` (new, calls `/by-slug/:slug`)
- `createEvent(token, data: CreateEventDto)` (typed)
- `updateEvent(token, id, data: UpdateEventDto)` (typed)
- `deleteEvent(token, id)` (keep)
- `getEventRoles(token, id): Promise<EventRolesResponse>` (new)
- `addEventRole(token, id, data: AddEventRoleDto)` (new)
- `removeEventRole(token, id, data: RemoveEventRoleDto)` (new)

### 3) Add React Query hooks for Events (mirror hackathon hooks)

Files:

- Add `apps/ui-landing/src/hooks/useEventBySlug.ts`
- Add `apps/ui-landing/src/hooks/useEventRoles.ts`
- (Optional) Add `apps/ui-landing/src/hooks/useMyEvents.ts` if we want the dashboard list to be query-driven

These will:

- Pull Clerk token via `useAuth()`
- Use stable query keys
- Invalidate roles query after add/remove

### 4) Wire `/dashboard/events` list page to `GET /events/my` with safe parsing

File:

- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/page.tsx`](../../../Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/page.tsx)

Changes:

- Replace `getEvents(token)` with `getMyEvents(token)`
- Remove `as any` parsing and implement the same style as `dashboard/opportunity/page.tsx`:
- `isRecord()` guard
- `getString()` helper
- `extractEventRows()` mapping
- Populate:
- `slug` from `row.slug ?? row.id`
- `candidates` from `registrationCount` (or `participants.length` if returned)
- `isOpen/registrationLabel` from `status + registrationDeadline` (same logic as hackathons)

### 5) Wire Events roles management (remove mocks)

File:

- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/manage-roles/page.tsx`](../../../Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/manage-roles/page.tsx)

Changes:

- Replace mock owner/managers/evaluators with:
- `useEventBySlug(slug)` → derives `eventId`
- `useEventRoles(eventId)`
- `useAddEventRoleMutation(eventId)` / `useRemoveEventRoleMutation(eventId)`
- Keep existing UI components (`RoleCard`, `AddEditRoleModal`, `EmptyState`) but drive them from real data.

### 6) Small API base URL normalization fix

File:

- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/apiClient.ts`](../../../Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/apiClient.ts)

Change:

- Add `"/events"` to `knownResourceSuffixes` so misconfigured `NEXT_PUBLIC_API_URL` ending with `/events` still works.

## Out-of-scope for this PR (can follow-up)

- `dashboard/events/[slug]/edit-event/*`: currently modeled like hackathons (prizes/registration settings). Events DTOs are simpler, so we should redesign that screen after the baseline wiring is stable.
- `dashboard/events/[slug]/manage-registration`: currently mock; to wire it properly we’d need a backend endpoint to list participants for an event (e.g. `GET /events/:id/participants`) and decide what fields to show.