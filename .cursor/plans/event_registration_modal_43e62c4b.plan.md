---
name: Event registration modal
overview: "Add an authenticated registration flow on the public event page: clicking Register opens a modal that renders the event's configured registration questions and persists submitted answers while creating the event participation."
todos:
  - id: backend-schema-registration-answers
    content: Add Prisma models for event registration submissions + answers linked to event, user, and registration fields; generate migration.
    status: done
  - id: backend-join-accept-answers
    content: Extend POST /events/:id/join to accept optional answers payload; validate field requirements/types/options; persist submission+answers in same transaction as participant creation.
    status: done
    dependencies:
      - backend-schema-registration-answers
  - id: types-add-join-event-dto
    content: Add strict DTO/types for join event payload and answer values in @oppskills/types and export via frontend bundle as needed.
    status: done
  - id: frontend-event-registration-modal
    content: Build EventRegistrationModal that renders event.registrationForm.fields (excluding attachments) with client-side validation and submit handler.
    status: done
    dependencies:
      - types-add-join-event-dto
  - id: frontend-auth-gate-register
    content: "Update /events/[slug] Register button handler: if logged out open Clerk sign-in modal; if logged in open registration modal; submit calls joinEvent API client."
    status: done
    dependencies:
      - frontend-event-registration-modal
      - backend-join-accept-answers
---

# Event Registration Modal (Auth + Persisted Answers)

## Key decisions
- **Auth required**: If the user is logged out and clicks **Register**, we will open the **Clerk sign-in modal** (no registration modal shown until signed in).
- **Questions source**: Questions come from the event’s `registrationForm.fields` (already returned by `GET /events/by-slug/:slug`).
- **Persist answers**: We will store submitted answers in the database.
- **Attachments**: v1 will **not** support `ATTACHMENTS` fields; frontend will show a clear message and backend will reject submissions containing unsupported field types.

> Terminology correction (important): the backend currently supports joining via `POST /events/:id/join`, and it stores participants, but it **does not yet accept or persist registration answers**. We’ll add that persistence now.

## Current code touchpoints (already in repo)
- Public event page uses a stubbed handler: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/events/[slug]/page.tsx`.
- Event details include `registrationForm.fields`: `/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/hooks/usePublicEventBySlug.ts`.
- Backend join endpoint: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.controller.ts` (`POST :id/join`) and `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/event/event.service.ts` (`joinEvent`).

## Flow (high level)
```mermaid
sequenceDiagram
participant User as User
participant UI as UI_Landing
participant Clerk as Clerk
participant API as Backend_API
participant DB as Database

User->>UI: ClickRegister
alt NotLoggedIn
UI->>Clerk: openSignInModal
Clerk-->>UI: SignedIn
User->>UI: ClickRegisterAgain
end
UI->>UI: OpenRegistrationModal
UI->>API: POST /events/:id/join (Authorization + answers)
API->>DB: ValidateRequiredFieldsAndTypes
API->>DB: CreateEventParticipant
API->>DB: CreateRegistrationSubmission+Answers
API-->>UI: Success
UI-->>User: SuccessToastAndUIState
```

## Backend changes (NestJS + Prisma)
- **Schema** (`/Users/harshit/Documents/freelance/oppskills-core/packages/database/prisma/schema.prisma`):
  - Add `EventRegistrationSubmissionEntity` with `eventId`, `userId`, timestamps.
  - Add `EventRegistrationAnswerEntity` linked to submission and `EventRegistrationFieldEntity`.
  - Store answer in a type-safe way (recommended: `valueJson Json` plus optional `valueText String?` if you want easier querying).
- **DTOs & validation**:
  - In types package (`/Users/harshit/Documents/freelance/oppskills-core/packages/types/src/dtos/backend/event/...`), add `JoinEventDto` (or `EventRegistrationSubmissionDto`) with:
    - `answers: Array<{ fieldId: string; value: string | number | string[] }>` (no `any`)
  - Validate:
    - required fields must be present
    - type matches field type (`EMAIL`, `PHONE_NO`, `NUMBER`, `OPTIONS`, `TEXT`)
    - options are within allowed list
    - reject `ATTACHMENTS` for now with a clear 400
- **Join endpoint**:
  - Update `POST /events/:id/join` to accept an **optional** body (backward compatible), validate answers, then within the existing transaction:
    - create participant
    - increment `registrationCount`
    - create submission + answers

## Frontend changes (Next.js)
- **Auth gating** (`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/events/[slug]/page.tsx`):
  - Use Clerk client APIs (`useAuth`, `useClerk`) to detect logged-out state.
  - If logged out: `openSignIn()`.
- **Modal UI**:
  - Create a new modal component (e.g. `EventRegistrationModal`) that renders fields from `event.registrationForm.fields`.
  - Input components:
    - TEXT/EMAIL/PHONE_NO/NUMBER: standard inputs
    - OPTIONS: select/radio based on existing design system
    - ATTACHMENTS: show “Not supported yet” message
  - Client-side validation mirrors backend rules and produces friendly field-level errors.
- **API client** (`/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/eventApi.ts`):
  - Add a typed `joinEvent(token, eventId, payload)` that POSTs to `/${id}/join` with auth headers.
- **Success state**:
  - On success: toast + disable button or show “Registered”. (We’ll choose the minimal UI change: disable and change label.)

## Execution notes
- Use **pnpm** (repo has `pnpm-lock.yaml`).
- Keep strict TypeScript: **no `any`, no non-null assertions, no double-casts**, and use **double quotes** for strings.

