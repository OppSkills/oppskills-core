# OppSkills Mobile Screen Status Tracker

Last updated: 2026-03-13

Status legend:
- `not-started`
- `in-progress`
- `ready-for-review`
- `approved`

## Welcome And Onboarding

| Screen | Domain | Status | Notes |
| --- | --- | --- | --- |
| Intro Screen | auth-onboarding | not-started | Splash-style brand intro |
| Onboarding Screen 7 | auth-onboarding | not-started | Campus discovery message |
| Onboarding Screen 8 | auth-onboarding | not-started | Updates and tracking message |
| Onboarding Screen 9 | auth-onboarding | not-started | Dual CTA: Get Started and Sign In |

## Sign-Up And Sign-In

| Screen | Domain | Status | Notes |
| --- | --- | --- | --- |
| Sign Up | auth-onboarding | in-progress | Mock submission flow planned in Phase 1 |
| Verify Identity OTP Empty | auth-onboarding | not-started | Empty state |
| Verify Identity OTP Filled | auth-onboarding | not-started | Filled state |
| Profile Setup Personal | auth-onboarding | not-started | Personal info fields |
| Profile Setup Education | auth-onboarding | not-started | Education fields |
| Profile Setup Skills | auth-onboarding | not-started | Suggested chips |
| Sign In | auth-onboarding | not-started | Mock submission only |

## Core Main Screens

| Screen | Domain | Status | Notes |
| --- | --- | --- | --- |
| Home Page | users, media, competitions, events, communities | not-started | Long-scroll mixed feed |
| Discover page | search, competitions, events, communities | in-progress | Base domain boundaries now scaffolded |
| Applied | applied | not-started | Applied status timeline cards |
| Discover Page Hackathons | hackathons | not-started | Category listing variant |
| Discover Page Competitions | competitions | not-started | Category listing variant |
| Discover Page Events Variant 1 | events | not-started | Community-style event cards |
| Discover Page Events Variant 2 | events | not-started | Image-led event cards |
| Search Page Recent Searches | search | not-started | Keyboard visible layout |
| Search Page Popular Searches | search | not-started | Keyboard visible layout |
| Search Page Typing | search | not-started | Query-in-progress suggestions |
| Search Page Results | search | not-started | Search result list |
| Competition Page | competitions | not-started | Long detail screen |
| Hackathon Page | hackathons | not-started | Long detail screen |

## Foundation Milestones

| Item | Status | Notes |
| --- | --- | --- |
| Phase 0 documents | approved | Scope lock, tracker, checklist finalized |
| Phase 1 src architecture | approved | Domain skeleton expanded to all planned modules |
| App providers | approved | Safe area, theme, and query provider wired in root app shell |
| Root app shell | approved | Root navigator now points to Phase 1 foundation dashboard |
| Query/cache readiness | approved | Centralized query keys and phase readiness hook added |
| Shared semantic constants | approved | Domain keys, statuses, tags, and route groupings centralized |
| Linting baseline | approved | ESLint config, scripts, and local lint pass completed |
| Type safety gate | approved | TypeScript local check passes in oppmobile package |