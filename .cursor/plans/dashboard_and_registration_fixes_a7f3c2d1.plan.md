# Dashboard and Registration Fixes Plan

**ID**: a7f3c2d1

**Created**: 2026-01-02

**Status**: In Progress

## Decisions Locked

- **Round tab meaning**: Round tabs show teams currently in that round only. Round 1 shows teams not yet qualified for Round 2.
- **Disqualify action**: Keep disqualify, but only as row-level (no bulk selection).
- **Publish → Draft**: Moving to Draft should reset approval status/fields.
- **Team details link**: Create a dedicated team detail page (recommended approach).

## Issues to Fix

### 1. Event Dashboard Additional Info Attachments Not Saving

**File**: `apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/_components/AdditionalInfo.tsx`

**Related**: `apps/ui-landing/src/app/dashboard/events/[slug]/edit-event/page.tsx`, `apps/backend/src/event/event-update-nested.dto.ts`**Problem**: Attachments uploaded in AdditionalInfo component are stored in local formData but not persisted to DB on save.**Fix**: Ensure the save mutation includes `additionalInfo.attachments` in the API payload and backend DTO accepts it.---

### 2. Opportunity "About" Above Rounds + Rich Text Rounds Description

**Files**:

- Public: `apps/ui-landing/src/app/competitions/[slug]/_components/RoundsTimeline.tsx`
- Organizer: `apps/ui-landing/src/app/dashboard/opportunity/[slug]/edit-opportunity/_components/RoundsAndStages.tsx`

**Problem**: About section appears after rounds; rounds description is plain text.**Fix**:

- Reorder layout so About appears above Rounds in both public and organizer views
- Render rounds description as rich text (dangerouslySetInnerHTML or similar)

---

### 3. Remove "Reviews Coming Soon" Tab

**File**: `apps/ui-landing/src/app/competitions/[slug]/_components/CompetitionTabs.tsx`**Problem**: Reviews tab shows "Coming Soon" placeholder.**Fix**: Remove the tab entirely from the tabs list and any related panel content.---

### 4. Global Error Toast Messaging

**Files**:

- `apps/ui-landing/src/lib/api/apiClient.ts`
- Various components with toast calls

**Problem**: Toast shows error code instead of backend error message.**Fix**:

- Create/update error extraction helper to parse `error.response.data.message`
- Update toast calls to use extracted message with optional description

---

### 5. Competition Register Button + Team Status After Registration

**File**: `apps/ui-landing/src/app/competitions/[slug]/_components/CompetitionSidebar.tsx`**Problem**: After registration, button still shows "Register for free" instead of "Registered" with team status.**Fix**:

- Refetch/invalidate team status query after registration
- Change button to "Registered" (disabled) when user has a team
- Show team status card below: leader name, member avatars, "View Team" link

---

### 6. Opportunity Edit Rounds Attachments Toggle Not Saving

**Files**:

- `apps/ui-landing/src/app/dashboard/opportunity/[slug]/edit-opportunity/_components/RoundsAndStages.tsx`
- `apps/backend/src/hackathon/hackathon.service.ts`

**Problem**: Enabling attachments for rounds doesn't persist after reload.**Fix**: Ensure attachment toggle state is included in round update payload and backend persists it.---

### 7. Publish → Draft Toggle for Event and Opportunity

**Files**:

- `apps/ui-landing/src/app/dashboard/events/[slug]/settings/page.tsx`
- `apps/ui-landing/src/app/dashboard/opportunity/[slug]/settings/page.tsx`

**Problem**: No way to move a published event/opportunity back to draft.**Fix**: Add "Move to Draft" button with confirmation dialog, calling status update endpoint.---

### 8. Managed Registration Qualify/Disqualify UX

**File**: `apps/ui-landing/src/app/dashboard/opportunity/[slug]/manage-registration/_components/Participants.tsx`**Problem**: Currently uses batch select + action pattern.**Fix**:

- Add row-level actions: primary "Qualify to Next Round" button, secondary "Disqualify" button
- Remove batch selection controls (or keep as secondary option)

---

### 9. Managed Registration Tabs Filtering

**File**: `apps/ui-landing/src/app/dashboard/opportunity/[slug]/manage-registration/page.tsx`**Problem**: Round tabs may not filter correctly; need "All" to show everyone, round tabs to show only participants in that round.**Fix**: Ensure filtering logic correctly separates all registrations vs round-specific qualified participants.---

### 10. Team Detail Page Fixes

**File**: `apps/ui-landing/src/app/dashboard/opportunity/[slug]/manage-registration/[teamID]/page.tsx`**Problems**:

- Team members missing full details (only email and register date showing)
- Registration answers showing error in console
- Round submission files shown as raw JSON

**Fix**:

- Display full member details (name, avatar, college, role, etc.)
- Fix registration answers data loading/parsing
- Render submission files as clickable links with file names

---

## Implementation Order

1. Global error toast messaging (foundational)
2. Event dashboard additional info attachments
3. Opportunity rounds attachments toggle
4. Remove reviews coming soon tab
5. Opportunity about above rounds + rich text
6. Publish → Draft toggle
7. Competition register button + team status
8. Managed registration qualify/disqualify UX
9. Managed registration tabs filtering
10. Team detail page fixes

## Files to Modify

### Frontend (apps/ui-landing/src/)

- `lib/api/apiClient.ts` - error handling
- `lib/utils.ts` - toast helper
- `app/dashboard/events/[slug]/edit-event/page.tsx` - save mutation
- `app/dashboard/events/[slug]/edit-event/_components/AdditionalInfo.tsx` - verify
- `app/dashboard/events/[slug]/settings/page.tsx` - draft toggle
- `app/dashboard/opportunity/[slug]/edit-opportunity/_components/RoundsAndStages.tsx` - attachments + rich text
- `app/dashboard/opportunity/[slug]/settings/page.tsx` - draft toggle
- `app/dashboard/opportunity/[slug]/manage-registration/page.tsx` - tabs filtering
- `app/dashboard/opportunity/[slug]/manage-registration/_components/Participants.tsx` - qualify buttons
- `app/dashboard/opportunity/[slug]/manage-registration/[teamID]/page.tsx` - team detail fixes
- `app/competitions/[slug]/_components/CompetitionTabs.tsx` - remove reviews
- `app/competitions/[slug]/_components/CompetitionSidebar.tsx` - register button + team status
- `app/competitions/[slug]/_components/RoundsTimeline.tsx` - about ordering + rich text

### Backend (apps/backend/src/)

- `event/event-update-nested.dto.ts` - verify attachments DTO
- `event/event.service.ts` - verify attachments persistence
- `hackathon/hackathon.service.ts` - verify rounds attachments persistence

## Testing Checklist

- [ ] Event additional info attachments persist after save and reload
- [ ] Opportunity rounds attachments toggle persists
- [ ] Reviews tab removed from competition page
- [ ] About section appears above rounds on competition page
- [ ] Round descriptions render as rich text
- [ ] Error toasts show backend message, not error code
- [ ] Register button changes to "Registered" after registration
- [ ] Team status card shows with member avatars
- [ ] Publish → Draft button works for events and opportunities
- [ ] Row-level qualify/disqualify buttons work
- [ ] Round tabs filter participants correctly
- [ ] Team detail page shows full member info
- [ ] Registration answers load without error