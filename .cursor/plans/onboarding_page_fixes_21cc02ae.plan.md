---
name: Onboarding page fixes
overview: Fix /onboarding category-specific validation bugs causing incorrect college requirements (especially for Working Professionals), and align frontend step validation and state cleanup with backend DTO rules.
todos:
  - id: backend-fix-onboarding-validation
    content: Update validateOnboardingData() to remove unintended college requirements for Working Professional and align school/college rules with CreateOnboardingDto.
    status: done
  - id: frontend-clear-stale-fields
    content: In onboarding UI, clear category-specific fields when userCategory changes to prevent hidden/stale data being submitted.
    status: done
  - id: frontend-step-validation-align
    content: Align validateCurrentStep() with backend rules (schoolAddress optional; no education requirement for working professional/fresher).
    status: done
  - id: manual-regression-checklist
    content: Manually verify onboarding for Working Professional, School, College (skip/non-skip), and category switching behavior.
    status: pending
---

# Fix `/onboarding` category validation bugs

## Findings (verified)

### Backend is enforcing rules that conflict with the shared DTO

In `apps/backend/src/user-accounts/user-accounts.service.ts` (`validateOnboardingData()`):
- **WORKING_PROFESSIONAL** currently requires `collegeId` unless `collegeSkipped=true`.
  - This matches your reported bug: selecting “Work” still forces college.
- **SCHOOL_STUDENT** currently requires `schoolAddress`, but the DTO marks it optional.
- **COLLEGE_STUDENT / PROFESSIONAL_SCHOOL_STUDENT** currently requires `collegeCurrentYear`, but the DTO marks it optional.
- **FRESHER** currently requires `collegeId + collegePassoutYear`, but you chose to **not require** these, and the UI doesn’t collect them.

### Frontend can’t satisfy current backend rules for Working Professionals

In `apps/ui-landing/src/app/onboarding/page.tsx`:
- For `WORKING_PROFESSIONAL`, the UI shows only `companyName` + `jobTitle`.
- There is **no way to set `collegeSkipped=true`** in that branch (the “My college is not listed” checkbox only appears for college categories).
- Default `collegeSkipped` is `false`, so current backend rejects professionals without a college.

## Decision choices confirmed

- **FRESHER**: do **not** require `collegeId/passoutYear`.
- **SCHOOL_STUDENT**: `schoolAddress` should be **optional**.

---

## Plan

### 1) Fix backend onboarding validation to align with DTO + intended UX

**File**: `apps/backend/src/user-accounts/user-accounts.service.ts`

Update `validateOnboardingData()` category rules:
- **SCHOOL_STUDENT**:
  - Require `schoolName` and `schoolClass`.
  - Make `schoolAddress` optional (remove the hard requirement).
- **COLLEGE_STUDENT / PROFESSIONAL_SCHOOL_STUDENT**:
  - Keep `collegeId` required unless `collegeSkipped=true`.
  - Make `collegeCurrentYear` optional (remove the hard requirement).
  - Keep passout year optional.
- **FRESHER**:
  - Remove hard requirements for `collegeId` and `collegePassoutYear`.
- **WORKING_PROFESSIONAL**:
  - Do **not** require `collegeId` or passout year.
  - Treat college fields as optional if provided.

This change should stop the incorrect “college id required” error for professionals.

### 2) Frontend: clear irrelevant fields when user switches category (prevents stale submissions)

**File**: `apps/ui-landing/src/app/onboarding/page.tsx`

Add a small effect on `userCategory` change:
- When switching to `WORKING_PROFESSIONAL`, clear `collegeId`, `collegeName`, and set `collegeSkipped=false`.
- When switching away from college categories, clear college-only fields.
- When switching away from school category, clear school-only fields.

This avoids cases where a user previously selected a college, then switches to “Working Professional” and still submits hidden college data.

### 3) Frontend: align step validation with backend rules

**File**: `apps/ui-landing/src/app/onboarding/page.tsx`

Update `validateCurrentStep()`:
- **SCHOOL_STUDENT**: keep requiring only `schoolName` + `schoolClass` (address optional).
- **COLLEGE_STUDENT / PROFESSIONAL_SCHOOL_STUDENT**: keep requiring `collegeId` unless skipped.
- **WORKING_PROFESSIONAL / FRESHER**: no education requirement.

### 4) Regression checklist (manual)

- **Working Professional**:
  - Select “Working Professional” → fill location → finish onboarding → should succeed without college.
- **College Student**:
  - Without selecting college and without skipping → should block at step 2.
  - With skip checked → should proceed.
- **School Student**:
  - Without address should still submit successfully.
- **Switching categories**:
  - Select college + pick a college → switch to working professional → submit → should not complain about college.

