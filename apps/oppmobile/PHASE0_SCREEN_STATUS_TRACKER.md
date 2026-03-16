# OppSkills Mobile Screen Status Tracker

Last updated: 2026-03-14

Status legend:
- `not-started`
- `in-progress`
- `ready-for-review`
- `approved`

## Welcome And Onboarding

| Screen | Domain | Status | Notes |
| --- | --- | --- | --- |
| Intro Screen | auth-onboarding | approved | Branded splash intro with timed transition and skip action |
| Onboarding Screen 7 | auth-onboarding | approved | Step-aware onboarding screen with skip, next, and pagination |
| Onboarding Screen 8 | auth-onboarding | approved | Step-aware onboarding screen with updates-focused illustration |
| Onboarding Screen 9 | auth-onboarding | approved | Terminal onboarding CTA to auth flow with sign-in shortcut |

## Sign-Up And Sign-In

| Screen | Domain | Status | Notes |
| --- | --- | --- | --- |
| Sign Up | auth-onboarding | approved | Email validation, mock Google action, and flow progression wired |
| Verify Identity OTP Empty | auth-onboarding | approved | OTP input validation and progression to filled state wired |
| Verify Identity OTP Filled | auth-onboarding | approved | Filled OTP review and profile setup continuation wired |
| Profile Setup Personal | auth-onboarding | approved | Personal form validation and state persistence enabled |
| Profile Setup Education | auth-onboarding | approved | Education form validation and state persistence enabled |
| Profile Setup Skills | auth-onboarding | approved | Skill search, chip selection, skip path, and profile persistence wired |
| Sign In | auth-onboarding | approved | Email/password validation, mock Google sign-in, and session entry wired |

## Core Main Screens

| Screen | Domain | Status | Notes |
| --- | --- | --- | --- |
| Home Page | users, media, competitions, events, communities | approved | Phase 6 complete: SectionList home feed with reusable section blocks, skeletons, empty states, and footer signature |
| Discover page | search, competitions, events, communities | approved | Default discover feed implemented with reusable scaffold, compact listing variants, and bookmark toggles |
| Applied | applied | approved | Phase 9 complete: Applied listing feed with profile header, filter chips, timeline progression, and action-state variants |
| Discover Page Hackathons | hackathons | approved | Hackathon discover variant implemented with shared category strip and opportunity card renderer |
| Discover Page Competitions | competitions | approved | Competition discover variant implemented with shared discover scaffold and bookmark behavior |
| Discover Page Events Variant 1 | events | approved | Events variant 1 implemented using community-style cards and reusable discover internals |
| Discover Page Events Variant 2 | events | approved | Events variant 2 implemented using feature-event cards and reusable discover internals |
| Search Page Recent Searches | search | approved | Implemented with interactive query list, keyboard-safe layout, and recent-query memory hooks |
| Search Page Popular Searches | search | approved | Implemented with popular query list, keyboard-safe layout, and typing transition behavior |
| Search Page Typing | search | approved | Implemented with live suggestion filtering and submit-to-results transition |
| Search Page Results | search | approved | Implemented with filtered result cards and routed detail handoffs |
| Competition Page | competitions | approved | Phase 10 complete: Long-form detail route implemented with shared tabbed template, rounds timeline, details, prizes, and contact sections |
| Hackathon Page | hackathons | approved | Phase 10 complete: Long-form detail route implemented with shared tabbed template, rounds timeline, details, prizes, and contact sections |

## Foundation Milestones

| Item | Status | Notes |
| --- | --- | --- |
| Phase 0 documents | approved | Scope lock, tracker, checklist finalized |
| Phase 1 src architecture | approved | Domain skeleton expanded to all planned modules |
| App providers | approved | Safe area, theme, and query provider wired in root app shell |
| Root app shell | approved | Root navigator now points to Phase 1 foundation dashboard |
| Query/cache readiness | approved | Centralized query keys and phase readiness hook added |
| Phase 11 data contracts and repositories | approved | Added typed entities, repository interfaces, mapper layer, mock repositories, API stubs, and repository-backed screen wiring |
| Shared semantic constants | approved | Domain keys, statuses, tags, and route groupings centralized |
| Linting baseline | approved | ESLint config, scripts, and local lint pass completed |
| Type safety gate | approved | TypeScript local check passes in oppmobile package |