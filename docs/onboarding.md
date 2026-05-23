# Onboarding System

This document describes the user onboarding system that ensures all users complete their profile before accessing protected areas of the application.

## Overview

The onboarding system requires users to complete a multi-step wizard before they can access protected routes like `/dashboard` and `/participants`. This ensures we have essential information about each user for personalized experiences and hackathon matching.

## Architecture

### Flow Diagram

```
User Signs In
      │
      ▼
Protected Route (e.g., /dashboard)
      │
      ▼
Server Layout calls GET /user-accounts/me
      │
      ├── onboarded = true ──► Access Granted
      │
      └── onboarded = false ──► Redirect to /onboarding
                                      │
                                      ▼
                              Complete 6-Step Wizard
                                      │
                                      ▼
                              PUT /user-accounts/onboarding
                                      │
                                      ▼
                              Redirect to /dashboard ✓
```

## Data Model

### Database Entities

#### UserEntity (updated)

```prisma
model UserEntity {
  // ... existing fields
  onboarded  Boolean  @default(false)

  // Onboarding profile (1:1 relation)
  onboardingProfile UserOnboardingProfileEntity?
}
```

#### CollegeEntity (new)

```prisma
model CollegeEntity {
  id       String  @id          // UUID from import data
  name     String
  country  String
  state    String
  city     String
  address  String
  website  String?
  logo     String?

  @@index([name])
  @@index([city])
  @@index([state])
}
```

#### UserOnboardingProfileEntity (new)

```prisma
model UserOnboardingProfileEntity {
  id     String @id @default(cuid())
  userId String @unique

  // Step 1: Primary Identity
  gender       Gender          // MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
  userCategory UserCategory    // SCHOOL_STUDENT, COLLEGE_STUDENT, etc.

  // Step 2: Education/Work Details
  schoolName         String?   // For school students
  schoolClass        String?
  schoolAddress      String?
  collegeId          String?   // FK to CollegeEntity
  collegeCurrentYear String?
  collegePassoutYear Int?
  collegeSkipped     Boolean   // If college not found in search
  companyName        String?   // For working professionals
  jobTitle           String?

  // Step 3: Location
  locationCoords    String
  locationState   String
  locationCountry String

  // Step 4: Interests and Skills
  interests String[]
  skills    String[]

  // Step 5: Experience Level (optional)
  experienceLevel ExperienceLevel?  // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT

  // Step 6: Team Preference (optional)
  teamPreference TeamPreference?    // LOOKING_FOR_TEAM, HAVE_TEAM, etc.
}
```

### Enums

| Enum              | Values                                                                                      |
| ----------------- | ------------------------------------------------------------------------------------------- |
| `Gender`          | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY                                                      |
| `UserCategory`    | SCHOOL_STUDENT, COLLEGE_STUDENT, WORKING_PROFESSIONAL, FRESHER, PROFESSIONAL_SCHOOL_STUDENT |
| `ExperienceLevel` | BEGINNER, INTERMEDIATE, ADVANCED, EXPERT                                                    |
| `TeamPreference`  | LOOKING_FOR_TEAM, HAVE_TEAM, OPEN_TO_EITHER, PREFER_SOLO                                    |

## API Endpoints

### User Accounts

#### GET /user-accounts/me

Returns the current user's profile with onboarding status.

**Authentication:** Required (Bearer token)

**Response:**

```json
{
  "id": "user_abc123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "imageUrl": "https://...",
  "accessLevel": "USER",
  "onboarded": true,
  "onboardingProfile": {
    "gender": "MALE",
    "userCategory": "COLLEGE_STUDENT",
    "collegeId": "college_xyz",
    "locationCoords": "Mumbai",
    "locationState": "Maharashtra",
    "locationCountry": "India",
    "interests": ["Web Development", "AI/ML"],
    "skills": ["JavaScript", "Python"],
    "experienceLevel": "INTERMEDIATE",
    "teamPreference": "OPEN_TO_EITHER"
  }
}
```

#### PUT /user-accounts/onboarding

Submit or update the onboarding profile. Automatically sets `onboarded = true`.

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "gender": "MALE",
  "userCategory": "COLLEGE_STUDENT",
  "collegeId": "college_xyz",
  "collegeCurrentYear": "3rd",
  "collegePassoutYear": 2025,
  "locationCoords": "Mumbai",
  "locationState": "Maharashtra",
  "locationCountry": "India",
  "interests": ["Web Development", "AI/ML"],
  "skills": ["JavaScript", "Python"],
  "experienceLevel": "INTERMEDIATE",
  "teamPreference": "OPEN_TO_EITHER"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Onboarding completed successfully",
  "onboardingProfile": { ... }
}
```

### Colleges

#### GET /colleges/search?q=...

Search colleges by name for autocomplete.

**Authentication:** Required (Bearer token)

**Query Parameters:**

- `q` (required): Search query (min 2 characters)

**Response:**

```json
[
  {
    "id": "college_abc",
    "name": "Indian Institute of Technology Bombay",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "address": "Powai, Mumbai",
    "website": "https://www.iitb.ac.in"
  }
]
```

#### POST /colleges/bulk-import (Dev Only)

Bulk import colleges from JSON data.

**Authentication:** None (dev-only endpoint)

**⚠️ Security Note:** This endpoint is **blocked in production** (`NODE_ENV === 'production'`). It's intentionally unauthenticated for development convenience but should never be exposed publicly.

**Request Body:**

```json
{
  "colleges": [
    {
      "id": "unique-uuid",
      "name": "College Name",
      "country": "India",
      "state": "State Name",
      "city": "City Name",
      "address": "Full Address",
      "website": "https://college.edu",
      "logo": "https://logo.url"
    }
  ]
}
```

**Response:**

```json
{
  "imported": 150,
  "failed": 2,
  "errors": ["Failed to import college xyz: duplicate key"]
}
```

## Frontend Implementation

### Protected Route Gates

Server layouts for protected routes check onboarding status:

```typescript
// apps/ui-webapp/src/app/dashboard/layout.tsx
export default async function DashboardLayout({ children }) {
  const { getToken, userId } = await auth();

  if (!userId) redirect("/sign-in");

  const token = await getToken();
  const me = await getMe(token);

  if (!me.onboarded) redirect("/onboarding");

  return <>{children}</>;
}
```

### Onboarding Wizard

The onboarding page (`/onboarding`) is a 6-step wizard:

| Step | Name               | Required | Description                                   |
| ---- | ------------------ | -------- | --------------------------------------------- |
| 1    | Primary Identity   | ✅       | Gender and user category                      |
| 2    | Education/Work     | ✅\*     | School/College/Work details based on category |
| 3    | Location           | ✅       | City, State, Country                          |
| 4    | Interests & Skills | ❌       | Select from suggestions                       |
| 5    | Experience Level   | ❌       | Self-rated experience                         |
| 6    | Team Preference    | ❌       | Hackathon team preferences                    |

\*Step 2 requirements depend on selected user category

### URL State Management

Step is stored in URL query parameter using `nuqs`:

- `/onboarding?step=1`
- `/onboarding?step=2`
- etc.

This allows:

- Browser back/forward navigation
- Shareable/bookmarkable step links
- Page refresh without losing progress

### Layout Handling

The onboarding page renders without:

- Navigation bar
- Footer
- Sidebar

This creates a focused, distraction-free experience.

## User Categories & Conditional Fields

| Category                    | Required Fields                       |
| --------------------------- | ------------------------------------- |
| SCHOOL_STUDENT              | schoolName, schoolClass               |
| COLLEGE_STUDENT             | collegeId (or collegeSkipped)         |
| PROFESSIONAL_SCHOOL_STUDENT | collegeId (or collegeSkipped)         |
| WORKING_PROFESSIONAL        | None (companyName, jobTitle optional) |
| FRESHER                     | None                                  |

## ClerkAuthGuard User Upsert

The `ClerkAuthGuard` automatically upserts users on every authenticated request:

```typescript
// Ensure user exists in DB (even if webhook hasn't fired)
await prisma.userEntity.upsert({
  where: { id: userId },
  update: { email: primaryEmail },
  create: { id: userId, email: primaryEmail },
});
```

This ensures the user record exists before any `/me` or `/onboarding` API calls.

## Testing

### Manual Testing Checklist

1. **New User Flow:**
   - [ ] Sign up new account
   - [ ] Navigate to /dashboard
   - [ ] Verify redirect to /onboarding
   - [ ] Complete all 6 steps
   - [ ] Verify redirect to /dashboard
   - [ ] Verify can now access /dashboard and /participants

2. **Existing User (Not Onboarded):**
   - [ ] Create user via Clerk webhook without onboarding
   - [ ] Navigate to protected route
   - [ ] Verify redirect to /onboarding

3. **Existing User (Onboarded):**
   - [ ] User with completed onboarding
   - [ ] Navigate to /dashboard
   - [ ] Verify direct access (no redirect)

4. **College Search:**
   - [ ] Type in college search field
   - [ ] Verify suggestions appear
   - [ ] Verify selection populates the field
   - [ ] Test "My college is not listed" checkbox

5. **Bulk Import (Dev Only):**
   ```bash
   curl -X POST http://localhost:3001/colleges/bulk-import \
     -H "Content-Type: application/json" \
     -d '{"colleges": [{"id": "test-1", "name": "Test College", ...}]}'
   ```

## Files Modified/Created

### Backend

- `apps/backend/src/colleges/` (new module)
  - `colleges.module.ts`
  - `colleges.controller.ts`
  - `colleges.service.ts`
- `apps/backend/src/user-accounts/user-accounts.controller.ts` (updated)
- `apps/backend/src/user-accounts/user-accounts.service.ts` (updated)
- `apps/backend/src/common/clerk-auth.guard.ts` (updated)
- `apps/backend/src/app.module.ts` (updated)

### Types

- `packages/types/src/enums/index.ts` (updated)
- `packages/types/src/dtos/backend/account/onboarding.dto.ts` (new)
- `packages/types/src/dtos/backend/account/college.dto.ts` (new)
- `packages/types/src/dtos/backend/account/index.ts` (updated)

### Database

- `packages/database/prisma/schema.prisma` (updated)
- Migration: `20251220131045_add_onboarding_colleges`

### Frontend

- `apps/ui-webapp/src/app/onboarding/page.tsx` (new)
- `apps/ui-webapp/src/app/dashboard/layout.tsx` (new)
- `apps/ui-webapp/src/app/participants/layout.tsx` (new)
- `apps/ui-webapp/src/lib/api/usersApi.ts` (updated)
- `apps/ui-webapp/src/lib/api/collegesApi.ts` (new)
- `apps/ui-webapp/src/components/layout-provider.tsx` (updated)
- `apps/ui-webapp/src/components/ui/progress.tsx` (new)
