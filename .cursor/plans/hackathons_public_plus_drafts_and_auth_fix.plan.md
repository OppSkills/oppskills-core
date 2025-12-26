# Hackathons: Public Competitions + Draft Visibility + Auth Fix Plan

## Status

- **Phase:** Implementation
- **Started:** 2025-12-26

## Goals

1. Fix data leak where any authenticated user can read other users' **DRAFT** hackathons via:
   - `GET /hackathons/:id`
   - `GET /hackathons/by-slug/:slug`

2. Replace `/competitions` mock data with real APIs:
   - Always show **public** hackathons
   - If logged in, also show **my drafts** (owner/manager) **interleaved** in the same list with a "Draft" badge.

3. Allow organizers/managers/admins to open draft hackathons in `/competitions/[slug]`:
   - Render the **same public detail UI** with a "Draft" banner.
   - No preview links; access is role-based.

## Non-goals (explicitly out of scope)

- Payments
- Organizer "main stats dashboard page"
- Changing "external registration form link" behavior
- Adding attachment upload support for registration answers (leave as-is)

## Decisions / Requirements (locked)

- Draft visibility: **Owner + Managers + Admins**
- Unauthorized draft reads should return **404** (avoid existence leaks)
- `/competitions` should show public hackathons + logged-in organizer's drafts
- Draft detail page uses same `/competitions/[slug]` UI + **Draft banner**
- "Admin" logic stays as current backend `isAdminUser()` implementation

---

## Work Breakdown

### A) Backend — Fix hackathon read authorization (HIGH)

**Problem:** `HackathonService.getHackathonById/getHackathonBySlug` return full entities with no access checks.

**Plan**

1. Update controller endpoints to accept `@Req()` and pass `userId`:
   - `GET /hackathons/:id`
   - `GET /hackathons/by-slug/:slug`

2. Add a new service method (or internal helper) to enforce access:
   - Load hackathon by `id/slug` (include needed relations)
   - Determine `isPubliclyVisible`:
     - `status in ['PUBLISHED','ONGOING']` AND `approvalStatus === 'APPROVED'`
   - If public → allow any authenticated user
   - Else require:
     - `ownerId === userId` OR
     - `isHackathonManager(hackathonId, userId)` OR
     - `isAdminUser(userId)`
   - If not allowed → throw `NotFoundException` (404)

3. (Optional hardening) Evaluate `GET /hackathons`:
   - It currently lists everything with deep includes.
   - Decide one of:
     - make admin-only, OR
     - remove/stop using in UI, OR
     - change it to behave like "my hackathons" (preferred is to stop using it and rely on `/hackathons/my`).

**Acceptance Criteria**

- [x] Random logged-in user cannot read someone else's draft by id/slug (404).
- [x] Owner/manager/admin can read their draft by id/slug.
- [x] Public-approved hackathon remains readable by any authenticated user.
- [x] GET /hackathons restricted to admin-only.

**Tests**

- [ ] Add backend tests covering:
  - public-visible hackathon readable by unrelated authed user
  - draft readable by owner
  - draft readable by manager
  - draft readable by admin
  - draft returns 404 for unrelated user

---

### B) Frontend — `/competitions` uses real APIs + shows drafts (HIGH)

**Current:** `apps/ui-landing/src/app/competitions/page.tsx` uses `MOCK_COMPETITIONS`.

**Plan**

1. Fetch public list:
   - Use existing `usePublicHackathons()` (calls `GET /hackathons/public`)

2. If logged in:
   - Fetch `getMyHackathons(token)` (calls `GET /hackathons/my`)
   - Transform to "competition card model"

3. Merge & de-dupe:
   - Start with public hackathons
   - Add "my hackathons" that are **not publicly visible**
   - De-dupe by `id`
   - Interleave drafts in list; show `Draft` badge

4. Update filtering logic:
   - Replace mock-only fields (`mode`, `status` strings like "Open/Ended") with backend fields:
     - lifecycle status: `status`
     - "registration open/closed" derived from:
       - `registrationDeadline`
       - `isRegistrationPaused`
       - `status` (completed/cancelled)
       - `maxTeams` maybe (if feasible)
   - Ensure filters don't break drafts.

**Acceptance Criteria**

- [x] Logged-out: shows only public approved hackathons.
- [x] Logged-in owner/manager: sees public + their drafts.
- [x] Draft cards clearly marked and clickable.

---

### C) Frontend — `/competitions/[slug]` supports drafts for authorized users (HIGH)

**Current:** uses public endpoint only (`getPublicHackathonBySlug`).

**Plan**

1. Data loading strategy:
   - Try public fetch first
   - If 404 and user logged in → fetch authenticated `getHackathonBySlug(token, slug)`
   - If authenticated fetch succeeds → render same UI + "Draft" banner
   - If it fails → show Not Found

2. Banner:
   - Simple top-of-page callout: "Draft — only visible to you and your team"

**Acceptance Criteria**

- [x] Draft visible to owner/manager/admin via `/competitions/[slug]`.
- [x] Draft not visible to unrelated users (looks like not found).

---

### D) Inventory + reduce risk: `GET /hackathons` and `useHackathons()` (MEDIUM-HIGH)

**Plan**

- Find usage of `useHackathons()` / `getHackathons()`.
- Ensure UI does not rely on "list all hackathons".
- If endpoint is still needed, restrict it (admin-only).

**Acceptance Criteria**

- [x] No non-admin path can enumerate all hackathons.

---

### E) Participant edge-case UX alignment (MEDIUM)

**Plan**

- Map backend registration blockers to UI states for the register CTA:
  - paused → show "Registrations paused"
  - deadline passed → show "Registration closed"
  - maxTeams reached → show "Teams full"
  - already registered → show "You're already registered / view team"
- Ensure these states are derived consistently on detail and register flows.

**Acceptance Criteria**

- [x] UX prevents obvious "click then fail" patterns where possible, while backend remains source of truth.

---

## Rollout / Validation Checklist

- [ ] Backend tests green
- [ ] Manual smoke:
  - as unrelated logged-in user: cannot open draft by slug/id
  - as owner: can open draft in competitions detail
  - as owner: draft appears in competitions list
  - public hackathons still work for logged-out users

---

## Implementation Order

1. [x] Backend auth fix + tests
2. [x] Competitions list wiring + merge drafts
3. [x] Competitions detail fallback fetch + Draft banner
4. [x] Remove/restrict `GET /hackathons` usage
5. [x] Edge-case UX polish
