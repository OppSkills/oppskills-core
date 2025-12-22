---
name: Event registration questions fixes
overview: Fix public event registration to always ask default questions + show organizer custom questions; repair broken gender dropdown (empty options); and implement a backend-backed “default fields” system that is UI-first (not pre-seeded) but still stores answers in the same EventRegistrationAnswerEntity model via lazy-created DB fields.
todos:
  - id: frontend-always-ask-defaults
    content: Update public event detail registration to always open modal with merged default + custom fields; stop direct join when form is empty.
    status: done
  - id: frontend-fix-gender-options
    content: "Fix OPTIONS rendering: inject default gender options when field label is Gender and options are empty; ensure required markers correct."
    status: done
  - id: dashboard-dont-persist-defaults
    content: Update edit-event registration form save to persist only custom questions (keep defaults UI-only) and add default gender options in the modal UI.
    status: done
  - id: backend-lazy-create-default-fields
    content: In joinEvent, upsert registration form and create missing default fields with negative order; enforce conditional requiredness by userCategory and save all answers.
    status: done
  - id: end-to-end-verify
    content: "Manual test: no custom questions, custom questions, working professional, college student, gender dropdown, answers saved and reflected in registrations status."
    status: pending
---

# Event registration questions: defaults + custom + bug fixes

## Current bugs (verified)

### 1) Default questions are never asked unless organizer created/saved a registration form

In `apps/ui-landing/src/app/events/[slug]/page.tsx`:
- The modal opens only if `event.registrationForm.fields.length > 0`.
- If organizer never created questions, `registrationForm` is null/empty → user is registered via `handleJoinEvent([])` → **no questions asked**.

### 2) Gender dropdown renders but has no selectable options

In `apps/ui-landing/src/components/ui/hackathon/RegistrationQuestionsModal.tsx` the fixed default question “Gender” has `type: "Options"` but **no default options**, and the edit-event autosave currently persists these fixed questions into DB (so Gender field can end up as OPTIONS with empty options).

In `apps/ui-landing/src/app/events/[slug]/_components/EventRegistrationModal.tsx`:
- OPTIONS fields render with `field.options.map(...)`.
- If options are empty → dropdown shows **no items**.

### 3) Custom questions created in dashboard may not show in public registration

Likely causes in current flow:
- If organizers never saved registration form (default UI shows fixed questions but nothing persisted), public API returns no fields.
- If gender OPTIONS stored with empty options, the field effectively breaks the form.

## Constraints / product decisions (confirmed)

- **Default questions should be treated the same as custom** (asked + saved as event registration answers).
- **Do not pre-seed default questions in DB “in the beginning”**.
- Storage approach chosen: **lazy-create DB field rows** for default questions, so they have real `fieldId`s and can be saved in `EventRegistrationAnswerEntity`.
- Default questions are **conditional** (e.g., working professionals shouldn’t be forced to provide college details).

---

## Plan

### A) Define the system default questions (UI + backend)

Define a small canonical list of default fields with stable labels and types:

- Always ask:
  - `Name` (TEXT)
  - `Email` (EMAIL)
  - `Phone No.` (PHONE_NO)
  - `Gender` (OPTIONS) with options `[MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY]`

- Conditional field (one of these, depending on user’s onboarding category):
  - If `userCategory` in (COLLEGE_STUDENT, PROFESSIONAL_SCHOOL_STUDENT, FRESHER): `College Name` (TEXT)
  - If `userCategory` == WORKING_PROFESSIONAL: `Company Name` (TEXT)
  - If `userCategory` == SCHOOL_STUDENT: `School Name` (TEXT)

**Prefill** using `GET /user-accounts/me` + Clerk where available.

### B) Frontend: always show default questions even when event has no registration form

**File**: `apps/ui-landing/src/app/events/[slug]/page.tsx`

Changes:
- Build `fieldsForModal = mergeDefaultAndCustomFields(event.registrationForm?.fields, meData/onboardingProfile)`.
- Open modal if `fieldsForModal.length > 0` (it will always be >0 for onboarded users).
- Stop calling `handleJoinEvent([])` just because there are no DB fields.

**File**: `apps/ui-landing/src/app/events/[slug]/_components/EventRegistrationModal.tsx`

Changes:
- Add a small normalizer before rendering:
  - If `field.label == "Gender"` and `field.type == "OPTIONS"` and `options` empty → inject the default gender options.
- Ensure required markers are correct for default + conditional fields.

### C) Dashboard: show default questions in the editor, but do NOT persist them as DB fields

**Files**:
- `apps/ui-landing/src/components/ui/hackathon/RegistrationQuestionsModal.tsx`
- `apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/page.tsx`

Changes:
- Keep fixed questions visible in the modal UI.
- Update the “Save” behavior so the payload to `updateEventRegistrationForm()` only includes **custom questions**.
  - This honors “don’t add defaults in DB at the beginning”.
- Also set default Gender question options in the modal UI (so organizers see it correctly), but it won’t be persisted unless they add custom OPTIONS fields.

### D) Backend: lazy-create default fields at registration time and enforce conditional requiredness

**File**: `apps/backend/src/event/event.service.ts` in `joinEvent()`

Changes:
- Before validation:
  - Fetch user onboarding profile (`userOnboardingProfileEntity`) to determine `userCategory`.
  - Upsert `EventRegistrationFormEntity` if missing.
  - Ensure default fields exist by **creating missing `EventRegistrationFieldEntity` rows**.
    - Use **negative `order` values** for defaults (e.g., -50..-1) so they sort before custom fields and don’t collide with custom `order` (which uses 0..N).
    - Ensure Gender has options.
- Validation:
  - Enforce required answers for:
    - Applicable default fields (based on `userCategory`), regardless of `field.required`.
    - Custom fields using `field.required`.
  - For OPTIONS:
    - If a field’s options are empty but it’s the Gender default field, use the default gender options for validation.
- Save:
  - Save answers for both defaults and custom fields into `EventRegistrationSubmissionEntity` + `EventRegistrationAnswerEntity`.

### E) Public API: ensure the registration form returned includes fields (defaults will appear after first registration)

No endpoint changes required if defaults are created on join; after first registration, the public event response will include those fields.

(If you want defaults to appear even before the first registration, add a public computed field list on the frontend; that’s already covered in step B.)

---

## Incremental rollout order

1) Fix modal opening logic + gender options injection (frontend) so users can register with defaults immediately.
2) Change dashboard save to persist only custom questions (prevents creating broken Gender OPTIONS fields).
3) Add backend lazy-create defaults + conditional required enforcement + storage.
4) Verify custom questions + defaults both save and show correctly.

---

## Regression checklist

- Event with **no custom questions**:
  - Clicking Register opens modal and asks defaults.
- Gender dropdown has options and accepts prefilled onboarding value.
- Event with **custom questions**:
  - Modal shows defaults + custom.
- Working professional:
  - Sees Company Name (not College Name) and can submit.
- Answers are saved in DB for both defaults and custom (same table model).

