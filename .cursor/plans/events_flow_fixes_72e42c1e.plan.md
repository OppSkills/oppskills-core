---
name: Events flow fixes
overview: Re-audit current Events flow (public + organizer dashboard) and fix critical security leaks and major dashboard flow breaks, including registration questions and registrations list behavior, while keeping tickets/notifications explicitly marked as not implemented.
todos:
  - id: secure-public-vs-dashboard-events
    content: Create `/events/public/*` endpoints with status/approval filtering and sanitized responses; guard dashboard event detail/id/roles endpoints to prevent PII leaks.
    status: pending
  - id: limit-edit-event-non-draft
    content: Make edit-event page limited for non-DRAFT events (disable DRAFT-only sections and calls) and add a banner explaining restrictions.
    status: pending
    dependencies:
      - secure-public-vs-dashboard-events
  - id: fix-edit-basicdetails-list-button
    content: Remove/repurpose the dead “List Event” button in edit-event BasicDetails to link to Settings publish flow.
    status: pending
    dependencies:
      - limit-edit-event-non-draft
  - id: validate-registration-questions-mapping
    content: Verify registration questions modal → backend registrationForm fields mapping and keep strict typing (no unsafe casts).
    status: pending
    dependencies:
      - limit-edit-event-non-draft
  - id: dashboard-events-registration-open-logic
    content: Fix dashboard events list open/closed computation to match backend behavior; keep switch display-only unless requested.
    status: pending
    dependencies:
      - secure-public-vs-dashboard-events
  - id: organize-create-event-datetime
    content: Fix organizer create-event page to send ISO datetime (date+time) for start/end/deadline, aligning with backend expectations.
    status: pending
    dependencies:
      - secure-public-vs-dashboard-events
  - id: upcoming-events-card-correctness
    content: Remove placeholder values and handle null deadlines safely in Upcoming Events cards.
    status: pending
    dependencies:
      - secure-public-vs-dashboard-events
  - id: banner-not-implemented-tickets-notifications
    content: Add “Not implemented yet—does not persist” warnings to Tickets and Notifications pages.
    status: pending
---

# Events flow audit + fixes (public + organizer dashboard)

## What changed since earlier

- **Event dashboard “Manage registrations” is now wired** to a real API:
- UI: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/manage-registration/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/manage-registration/page.tsx)
- Hook: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/useEventRegistrationsBySlug.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/useEventRegistrationsBySlug.ts)
- API client: `getEventRegistrationsBySlug()` in [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts)
- Backend: `GET /events/by-slug/:slug/registrations` in [`/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts) + `listEventRegistrationsBySlug()` in [`/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts)

## Key flow areas reviewed

### Public

- Landing “Upcoming Events”: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/components/landingpage/UpcomingEvents.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/components/landingpage/UpcomingEvents.tsx)
- Public event detail + registration questions modal: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/events/[slug]/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/events/[slug]/page.tsx) + [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/events/[slug]/_components/EventRegistrationModal.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/events/[slug]/_components/EventRegistrationModal.tsx)

### Organizer dashboard

- Events list: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/page.tsx)
- Event dashboard: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/page.tsx)
- Edit event (registration questions are defined here):
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/page.tsx)
- Basic details includes RegistrationQuestions modal and a **misleading “List Event” button with no handler**: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/_components/BasicDetails.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/_components/BasicDetails.tsx)
- Settings: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/settings/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/settings/page.tsx)
- Manage roles: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/manage-roles/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/manage-roles/page.tsx)
- Tickets/Notifications are currently **UI-only**: [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/tickets/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/tickets/page.tsx), [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/notifications/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/notifications/page.tsx)

## Major bugs / breaks found

### Critical security/privacy bugs

- **Public detail endpoints leak registrant PII**: `EventService.getEventBySlug()` and `getEventById()` include `participants.user.email` and are exposed via unguarded `GET /events/by-slug/:slug` and `GET /events/:id`.
- **Event roles are publicly readable**: `GET /events/:id/roles` is unguarded (exposes manager/evaluator emails).

### Major organizer dashboard flow breaks

- **Edit-event autosave vs backend rules mismatch**:
- Backend forbids most edits for non-DRAFT events, and nested updates are DRAFT-only.
- UI autosave currently attempts to save everything regardless, causing silent failures.
- You selected: **limited editing** for non-DRAFT events.
- **Edit-event “List Event” button is misleading** (no `onClick`). Publishing already happens via Settings → Submit for approval.
- **Tickets + Notifications are not persisted** (UI-only). You selected: **defer**, but add a clear “Not implemented yet” warning.

### Public flow issues

- Organizer create-event currently sends date-only values (time lost), while edit-event uses full ISO datetime logic.
- Upcoming events card still contains placeholder/hardcoded parts (not fatal but incorrect).
- External form links: you said **for now nothing happens** → we will not implement external-form registration behavior in this pass.

## Plan (fixes to implement)

### 1) Split public vs dashboard event endpoints (and remove PII from public)

- **Backend**
- Add **public** endpoints:
    - `GET /events/public` (list published + approved)
    - `GET /events/public/by-slug/:slug`
    - `GET /events/public/:id`
- Public endpoints must:
    - Filter to `status in (PUBLISHED, ONGOING)` and `approvalStatus = APPROVED`
    - Return a **sanitized shape** (no `participants`, no role lists, no emails beyond owner contact if you want it public)
- Convert existing endpoints to **dashboard (auth) endpoints**:
    - `GET /events/by-slug/:slug` → `@UseGuards(ClerkAuthGuard)`
    - `GET /events/:id` → `@UseGuards(ClerkAuthGuard)`
    - `GET /events/:id/roles` → `@UseGuards(ClerkAuthGuard)` and enforce owner/manager/admin access
- **Frontend**
- Update public pages/hooks to use `/events/public/*`:
    - `getPublicEventBySlug()` in [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts)
    - [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/usePublicEventBySlug.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/usePublicEventBySlug.ts)

### 2) Make edit-event limited for non-DRAFT events (avoid autosave failures)

- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/page.tsx)
- Read event `status` + `approvalStatus` from `eventRaw`.
- If not DRAFT:
    - Allow editing only the fields the backend allows (basic info changes).
    - Disable/hide DRAFT-only sections (registration form, prizes, additional info, maxUsers).
    - Prevent calling DRAFT-only endpoints.
    - Show an inline banner explaining the restriction and point to Settings for lifecycle/approval.
- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/_components/BasicDetails.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/_components/BasicDetails.tsx)
- Remove or repurpose the **dead** “List Event” button to link to Settings → “Submit for approval”.

### 3) Ensure registration questions in dashboard correctly map to backend registration form

- Verify/adjust mapping in `edit-event/page.tsx`:
- `RegistrationQuestionsModal` → `updateEventRegistrationForm()` payload
- Ensure ordering/type mapping is consistent and validated
- Keep strict TS (no `any`, no unsafe casts)

### 4) Dashboard correctness improvements (organizer-only)

- Events list “Registration Open/Closed”:
- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/page.tsx)
- Compute open/closed using backend-compatible rules (deadline, pause flag, approval status).
- Make the switch either display-only or actually toggle `isRegistrationPaused` (we’ll keep it display-only unless you ask otherwise).
- Tickets + Notifications pages:
- Add a clear banner “Not implemented yet—data is not saved” on:
    - [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/tickets/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/tickets/page.tsx)
    - [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/notifications/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/notifications/page.tsx)

### 5) Fix create-event time loss (align organizer create with edit-event)

- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/organize/event/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/organize/event/page.tsx)
- Build `startDate/endDate/registrationDeadline` as ISO datetime strings using selected time.
- Match the date-time combine logic already used in edit-event.

### 6) Public listing card correctness (non-blocking)

- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/components/landingpage/UpcomingEvents.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/components/landingpage/UpcomingEvents.tsx)
- Remove hardcoded “Free/Offline”, “Every Tue”, “10:00AM”, “Attendees 0”.
- Guard against null `registrationDeadline`.

## Files expected to change

- Backend:
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts)
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts)
- Frontend:
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts)
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/usePublicEventBySlug.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/usePublicEventBySlug.ts)
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/organize/event/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/organize/event/page.tsx)
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/page.tsx)
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/page.tsx)
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/_components/BasicDetails.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/_components/BasicDetails.tsx)
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/components/landingpage/UpcomingEvents.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/components/landingpage/UpcomingEvents.tsx)
- Tickets/Notifications banner-only: