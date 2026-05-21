---
name: Event registrations list
overview: Replace the mock “Manage registration” table on the Event dashboard with real registered users from the database (including onboarding-based university/location/course), behind an authenticated/authorized backend endpoint.
todos:
  - id: backend-registrations-endpoint
    content: Add authenticated/authorized `GET /events/by-slug/:slug/registrations` and service method to return mapped registration rows with onboarding-derived fields.
    status: pending
  - id: frontend-api-hook
    content: Add typed `getEventRegistrationsBySlug` API + `useEventRegistrationsBySlug` hook.
    status: pending
    dependencies:
      - backend-registrations-endpoint
  - id: ui-manage-registration
    content: Replace mock data in event manage-registration page with live data; keep UI/filters/modal; remove role badge; eliminate any `any` typings.
    status: pending
    dependencies:
      - frontend-api-hook
---

# Show registered users on Event Manage Registration

## Goal

Display **real event registrations (registered users)** on the Event dashboard route `apps/ui-landing/src/app/dashboard/events/[slug]/manage-registration/page.tsx`, replacing the current mock list.Note on terminology: “registered users” in this codebase are stored as **event participants / event registrations** (rows in `EventParticipantEntity`).

## Backend changes (secure registrations API)

- Add a new authenticated endpoint to list registrations for a given event slug, restricted to **OWNER / MANAGER / ADMIN**:
- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts)
  - New route: `GET /events/by-slug/:slug/registrations`
  - `@UseGuards(ClerkAuthGuard)`
  - Validate `slug` and authenticated `userId`
- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts)
  - New service method `listEventRegistrationsBySlug(slug, requesterUserId)`
  - Resolve event by `slug`, then enforce permission (reuse existing manager/admin/owner logic)
  - Query `eventParticipantEntity.findMany({ where: { eventId }, include: { user: { select: { ... }, include: { onboardingProfile: { include: { college: true } } } }, submission: true }, orderBy: { joinedAt: "desc" } })`
  - Map results to a response tailored for the dashboard table:
  - `name`, `email`, `avatarUrl`
  - `university` derived from onboarding (college/school/company)
  - `location` derived from onboarding (city/state/country)
  - `course` derived from onboarding (userCategory + year/jobTitle/etc.)
  - `status`: `"Completed"` if `submission` exists else `"Incomplete"`
  - `registeredOn`: ISO string from `joinedAt`
  - Add **runtime validation** and clear error responses (404 event not found, 403 forbidden, etc.).

## Frontend changes (replace mock table with live data)

- Add a typed API wrapper for the new backend route:
- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts)
  - Add `getEventRegistrationsBySlug(token, slug): Promise<EventRegistrationsResponse>` (no `any`)
- Add a React Query hook:
- Create [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/useEventRegistrationsBySlug.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/useEventRegistrationsBySlug.ts)
  - Uses Clerk `getToken()` + React Query, similar to existing `useEventBySlug`
- Update the Event manage-registration page UI:
- Update [`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/manage-registration/page.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/events/[slug]/manage-registration/page.tsx)
  - Remove `MOCK_PARTICIPANTS`
  - Fetch real registrations by `slug`
  - Keep the existing table + modal UX, but:
  - Populate `university/location/course/registeredOn` from the API
  - Keep `Completed/Incomplete` tabs backed by real computed status
  - Per your choice, **remove the role badge/field** (no team-leader concept in DB)
  - Fix TypeScript strictness issues introduced by the mock page (notably: remove `any` usages in column types/state).

## Validation

- Verify (locally) that:
- An OWNER/MANAGER/ADMIN can open `/dashboard/events/[slug]/manage-registration` and see registrations.
- A non-authorized user gets a clean 403 from the registrations endpoint.
- Public event pages do **not** use the registrations endpoint and therefore cannot access onboarding-derived details.

## Files touched

- Backend:
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts)
- [`/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts)
