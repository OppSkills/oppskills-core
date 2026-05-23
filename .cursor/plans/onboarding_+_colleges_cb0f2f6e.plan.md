---
name: Onboarding + colleges
overview: Create onboarding wizard gated for protected routes, backed by DB onboarded flag + onboarding profile. Add colleges table with search endpoint and dev-only bulk import.
todos:
  - id: db-add-colleges-and-onboarding
    content: Add CollegeEntity + onboarding fields/entities in Prisma schema; run migrate/generate workflow
    status: completed
  - id: types-add-onboarding-college-dtos
    content: Add enums + DTOs for onboarding and colleges in @oppskills/types and export them
    status: completed
    dependencies:
      - db-add-colleges-and-onboarding
  - id: backend-colleges-module
    content: Implement colleges search and dev-only bulk-import endpoints
    status: completed
    dependencies:
      - types-add-onboarding-college-dtos
  - id: backend-me-onboarding-endpoints
    content: Implement GET /user-accounts/me and PUT /user-accounts/onboarding with strict validation and upsert
    status: completed
    dependencies:
      - types-add-onboarding-college-dtos
  - id: backend-auth-upsert-user
    content: Upsert DB user row in ClerkAuthGuard on authenticated requests
    status: completed
    dependencies:
      - db-add-colleges-and-onboarding
  - id: frontend-route-gates
    content: Add server layouts for /dashboard and /participants to enforce onboarding gate via /me
    status: completed
    dependencies:
      - backend-me-onboarding-endpoints
  - id: frontend-onboarding-ui
    content: Build /onboarding wizard with college search combobox; submit onboarding; redirect to /dashboard after success
    status: completed
    dependencies:
      - backend-me-onboarding-endpoints
      - backend-colleges-module
  - id: manual-verify
    content: "Verify end-to-end: login -> gate -> onboarding submit -> access protected pages; verify college search + bulk import"
    status: pending
    dependencies:
      - frontend-route-gates
      - frontend-onboarding-ui
---

# Onboarding gate + College directory

## Goal

- Users must complete onboarding before accessing protected pages.
- Protected pages: `/dashboard/**` and `/participants`.
- Add a `College` table and support searching colleges from onboarding.
- Add a bulk college import API that is **dev-only** (blocked in production).

## Locked requirements

- **Onboarding flow**
- Steps:
  1. PrimaryIdentity (required)
  2. EducationWorkDetails (required)
  3. Location (required)
  4. InterestsAndSkills (required)
  5. ExperienceLevel (optional)
  6. TeamPreference (optional)

- **Primary identity fields**: gender (required; includes `PREFER_NOT_TO_SAY`), user category (required)
- **User categories**: `SCHOOL_STUDENT`, `COLLEGE_STUDENT`, `WORKING_PROFESSIONAL`, `FRESHER`, `PROFESSIONAL_SCHOOL_STUDENT`
  - Fresher = recent graduate not currently working
- **Location**: city + state + country (required)
- **College create**: removed for now (search + select only)
- **Post-login behavior**
- If already onboarded: user should be able to access `/dashboard` directly
- If not onboarded: protected routes must redirect to `/onboarding`
- **Bulk college import**
- Dev-only: allow only when `NODE_ENV !== "production"`
- NOTE: This is intentionally unauthenticated in dev per your choice; it’s unsafe if your dev server is publicly reachable.

## Data model changes (Prisma)

- Update [`packages/database/prisma/schema.prisma`](/Users/harshit/Documents/freelance/oppskills-core/packages/database/prisma/schema.prisma)
- Add `UserEntity.onboarded Boolean @default(false)`
- Add `CollegeEntity`
  - `id String @id` (UUID from your JSON)
  - `name String`
  - `country String`
  - `state String`
  - `city String`
  - `address String`
  - `website String?`
  - `logo String?`
  - Index: `@@index([name])`, `@@index([city])`, `@@index([state])`
- Add `UserOnboardingProfileEntity` (1:1 with `UserEntity`) including:
  - `gender`, `userCategory`
  - School: `schoolName`, `schoolClass`, `schoolAddress`
  - College: `collegeId` (FK to `CollegeEntity`), `collegeCurrentYear`, `collegePassoutYear`, `collegeSkipped`
  - Location: `locationCoords`, `locationState`, `locationCountry`
  - Interests: `interests String[]`
  - Skills: `skills String[]`
  - Optional: `experienceLevel`, `teamPreference`

## Shared types (`@oppskills/types`)

- Add enums + DTOs:
- `GenderValue` (includes `PREFER_NOT_TO_SAY`)
- `UserCategoryValue`
- `CreateOnboardingDto` / `UpdateOnboardingDto`
- `CollegeImportDto` (array of items matching your JSON)
- `CollegeSearchResultDto`
- Files:
- [`packages/types/src/dtos/backend/account/onboarding.dto.ts`](/Users/harshit/Documents/freelance/oppskills-core/packages/types/src/dtos/backend/account/onboarding.dto.ts) (new)
- [`packages/types/src/dtos/backend/account/college.dto.ts`](/Users/harshit/Documents/freelance/oppskills-core/packages/types/src/dtos/backend/account/college.dto.ts) (new)
- Export via [`packages/types/src/dtos/backend/account/index.ts`](/Users/harshit/Documents/freelance/oppskills-core/packages/types/src/dtos/backend/account/index.ts)
- Enums via [`packages/types/src/enums/index.ts`](/Users/harshit/Documents/freelance/oppskills-core/packages/types/src/enums/index.ts)

## Backend APIs (NestJS)

- **User accounts**
- [`apps/backend/src/user-accounts/user-accounts.controller.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/user-accounts/user-accounts.controller.ts)
  - `GET /user-accounts/me` (auth) → includes `onboarded` and onboarding profile
  - `PUT /user-accounts/onboarding` (auth) → validates conditional fields, upserts profile, sets `onboarded=true`
- **Colleges** (new module)
- `GET /colleges/search?q=...` (auth) → returns top matches for combobox (case-insensitive name contains)
- `POST /colleges/bulk-import` (NO auth; dev-only)
  - Reject if `NODE_ENV === "production"`
  - Accepts JSON array of college rows; upsert by `id`

## Frontend (Next.js)

- Add onboarding route:
- [`apps/ui-landing/src/app/onboarding/page.tsx`

](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/onboarding/page.tsx)

- Implements multi-step wizard; on submit calls `PUT /user-accounts/onboarding`.
- Also Check LayoutProvider this /onboarding should not use sidebar or header or footer, it should a simple page with dialog style thing. use nuqs where possible.
- For form use tanstack-form and use shadcn field comp. these are the docs for all the stuff https://ui.shadcn.com/docs/forms/tanstack-form
  https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts
- Add protected-route gating using server layouts:
- [`apps/ui-landing/src/app/dashboard/layout.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/dashboard/layout.tsx)
- [`apps/ui-landing/src/app/participants/layout.tsx`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/app/participants/layout.tsx)
- Each layout checks `GET /user-accounts/me`; if `onboarded=false` redirect to `/onboarding`.
- Add UI API calls:
- Extend [`apps/ui-landing/src/lib/api/usersApi.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/usersApi.ts) with `getMe` + `submitOnboarding`.
- Add [`apps/ui-landing/src/lib/api/collegesApi.ts`](/Users/harshit/Documents/freelance/oppskills-core/apps/ui-landing/src/lib/api/collegesApi.ts) with `searchColleges`.

## Verification

- Login → navigate to `/dashboard` and `/participants`:
- If not onboarded: redirected to `/onboarding`.
- After onboarding submit: access granted.
- College combobox:
