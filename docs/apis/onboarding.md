# Onboarding API

HTTP contracts for user onboarding and related profile updates. Payloads below match **`CreateOnboardingDto`** and the inline DTOs on `UserAccountsController` in `apps/backend` (see [Source of truth](#source-of-truth-in-code)).

**Identity (sign-up, sign-in, email verification, OAuth, passwords)** is **Clerk only** — not listed here. After a Clerk session exists, send **`Authorization: Bearer <jwt>`** on every call below.

---

## `PUT /user-accounts/onboarding`

Completes onboarding: validates **`CreateOnboardingDto`**, upserts `UserOnboardingProfile`, sets **`user.onboarded = true`**.

**Source:** `packages/types/src/dtos/backend/account/onboarding.dto.ts` (`CreateOnboardingDto`).

### Body: all accepted fields

| Field | Type | Notes |
|-------|------|--------|
| `gender` | `string` (enum) | **Required.** See [Gender](#enums). |
| `userCategory` | `string` (enum) | **Required.** See [User category](#enums). |
| `mobileNumber` | `string` | Optional. |
| `schoolName` | `string` | Required when `userCategory` is `SCHOOL_STUDENT` (see [Conditional requirements](#conditional-requirements)). |
| `schoolClass` | `string` | Required when `userCategory` is `SCHOOL_STUDENT`. |
| `schoolAddress` | `string` | Optional; only applies to school students. |
| `collegeId` | `string` | For college categories: supply **`collegeId` or `collegeName`** unless `collegeSkipped` is true (see [Conditional requirements](#conditional-requirements)). |
| `collegeName` | `string` | Same as `collegeId`; used when id unknown. Server may resolve/create a college only when location fields are set (see `submitOnboarding` in service). |
| `collegeCurrentYear` | `string` | Optional for `COLLEGE_STUDENT` / `PROFESSIONAL_SCHOOL_STUDENT`. |
| `collegePassoutYear` | `number` (integer) | Optional for those categories; **1900–2100** if sent. |
| `collegeSkipped` | `boolean` | Optional; default false. When true, college is not required for college categories. |
| `companyName` | `string` | Optional; intended for `WORKING_PROFESSIONAL`. |
| `jobTitle` | `string` | Optional; intended for `WORKING_PROFESSIONAL`. |
| `locationCity` | `string` | Optional. |
| `locationState` | `string` | Optional. |
| `locationCountry` | `string` | Optional. |
| `interests` | `string[]` | Optional; if present, array of strings (sanitized server-side). |
| `skills` | `string[]` | Optional; if present, array of strings (sanitized server-side). |
| `experienceLevel` | `string` (enum) | Optional. See [Experience level](#enums). |
| `teamPreference` | `string` (enum) | Optional. See [Team preference](#enums). |

**Not accepted on this route:** `firstName`, `lastName`, `email`, `password`, `course`, `courseSpecialization`, `rollNumber`, `cgpa` — those are **Clerk** or **`PATCH /user-accounts/profile`** / **`PATCH /user-accounts/education`**.

### Enums

#### Gender

`MALE` | `FEMALE` | `OTHER` | `PREFER_NOT_TO_SAY`

#### User category

`SCHOOL_STUDENT` | `COLLEGE_STUDENT` | `WORKING_PROFESSIONAL` | `FRESHER` | `PROFESSIONAL_SCHOOL_STUDENT`

#### Experience level (optional)

`BEGINNER` | `INTERMEDIATE` | `ADVANCED` | `EXPERT`

#### Team preference (optional)

`LOOKING_FOR_TEAM` | `HAVE_TEAM` | `OPEN_TO_EITHER` | `PREFER_SOLO`

### Conditional requirements

Rules combine **class-validator** on `CreateOnboardingDto` and **`validateOnboardingData`** in `UserAccountsService`:

| `userCategory` | Required | Notes |
|----------------|----------|--------|
| `SCHOOL_STUDENT` | `schoolName`, `schoolClass` | `schoolAddress` optional. |
| `COLLEGE_STUDENT`, `PROFESSIONAL_SCHOOL_STUDENT` | One of: `collegeId`, **`or`** `collegeName` | Unless `collegeSkipped === true`. `collegeCurrentYear` / `collegePassoutYear` optional. |
| `FRESHER` | — | No school/college block enforced in service. |
| `WORKING_PROFESSIONAL` | — | `companyName` / `jobTitle` optional. |

### Example bodies (valid keys only)

**College student**

```json
{
  "gender": "MALE",
  "userCategory": "COLLEGE_STUDENT",
  "mobileNumber": "+919876543210",
  "collegeId": "clx123",
  "collegeCurrentYear": "3rd Year",
  "collegePassoutYear": 2026,
  "collegeSkipped": false,
  "locationCity": "Mumbai",
  "locationState": "Maharashtra",
  "locationCountry": "India",
  "skills": ["React"],
  "interests": ["Hackathons"],
  "experienceLevel": "INTERMEDIATE",
  "teamPreference": "OPEN_TO_EITHER"
}
```

**School student**

```json
{
  "gender": "FEMALE",
  "userCategory": "SCHOOL_STUDENT",
  "schoolName": "Example High School",
  "schoolClass": "10",
  "schoolAddress": "Optional",
  "interests": [],
  "skills": []
}
```

**Fresher (minimal)**

```json
{
  "gender": "OTHER",
  "userCategory": "FRESHER",
  "skills": [],
  "interests": []
}
```

### Success response

```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "onboardingProfile": {}
}
```

`onboardingProfile` is the persisted Prisma `UserOnboardingProfileEntity` (full shape from DB).

### Errors

- **`400`** — validation / business rule (e.g. `"College is required unless skipped"`, `"School name is required for school students"`).
- **`401`** — missing or invalid JWT.

---

## `PATCH /user-accounts/profile`

Updates **`UserEntity`** name fields and nested onboarding **`gender` / `userCategory`**. Name changes are synced to **Clerk** by the backend.

**Accepted body (all optional):**

| Field | Type |
|-------|------|
| `firstName` | `string` |
| `lastName` | `string` |
| `gender` | `MALE` \| `FEMALE` \| `OTHER` \| `PREFER_NOT_TO_SAY` |
| `userCategory` | Same enum set as `CreateOnboardingDto.userCategory` |

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "MALE",
  "userCategory": "COLLEGE_STUDENT"
}
```

---

## `PATCH /user-accounts/education`

Updates education columns on the onboarding profile. **Not** part of `CreateOnboardingDto`.

**Accepted body (all optional):**

| Field | Type | Notes |
|-------|------|--------|
| `collegeId` | `string` \| `null` | Preferred when known. |
| `collegeName` | `string` | Resolution to id may require existing `locationCity` / `locationState` / `locationCountry` on the profile. |
| `course` | `string` | |
| `courseSpecialization` | `string` | |
| `startYear` | `string` | Stored as **college current year** (string). |
| `endYear` | `number` | Integer **1900–2100**; stored as pass-out year. |
| `rollNumber` | `string` | |
| `cgpa` | `string` | |

```json
{
  "collegeId": "clx123",
  "course": "B.Tech",
  "courseSpecialization": "Computer Science",
  "startYear": "2022",
  "endYear": 2026,
  "rollNumber": "22CS1001",
  "cgpa": "8.5"
}
```

---

## `PATCH /user-accounts/skills`

**Body:** JSON object with a **`skills`** array (top-level key must be `skills`).

```json
{
  "skills": ["React", "TypeScript"]
}
```

**Server validation:** array only; max **20** items; each item trimmed, non-empty, **≤ 50** characters; allowed per item: **letters, digits, spaces, `+`, `#`, `-`, `.`, `/`**. Invalid input → **`400`**.

---

## `PATCH /user-accounts/interests`

**Body:** JSON object with an **`interests`** array.

```json
{
  "interests": ["Hackathons", "Open Source"]
}
```

Same validation rules as **`skills`** (max 20, length, charset).

---

## `GET /user-accounts/me`

Returns the current **`UserEntity`** (with `onboardingProfile` include, including `college { id, name }` when linked). Use **`onboarded`** for routing.

Response shape follows Prisma; useful onboarding-related fields include `id`, `email`, `firstName`, `lastName`, `imageUrl`, `onboarded`, `onboardingProfile` (see `OnboardingProfileResponseDto` in `@oppskills/types` for a typed subset).

---

## `GET /user-accounts/profile`

Aggregated read: `personalInfo`, `educationInfo`, `skills`, `interests`, `stats` — for review/settings screens.

---

## `GET /colleges/search?q=…`

Authenticated college name search (autocomplete); returns up to **15** rows (`id`, `name`, `country`, `state`, `city`, etc.).

---

## Typical call order (implementation hint only)

1. Clerk session ready → **`GET /user-accounts/me`**.
2. Optional partial updates before completion: **`PATCH /profile`**, **`PATCH /education`**, **`PATCH /skills`**, **`PATCH /interests`**.
3. When `CreateOnboardingDto` requirements are met for the chosen category → **`PUT /user-accounts/onboarding`**.

Only **`PUT /onboarding`** sets **`onboarded: true`**.

---

## Source of truth in code

- `CreateOnboardingDto`: `packages/types/src/dtos/backend/account/onboarding.dto.ts`
- `UpdateProfileDto` / `UpdateEducationDto`: `apps/backend/src/user-accounts/user-accounts.controller.ts`
- `submitOnboarding`, `validateOnboardingData`, `updateEducation`: `apps/backend/src/user-accounts/user-accounts.service.ts`
