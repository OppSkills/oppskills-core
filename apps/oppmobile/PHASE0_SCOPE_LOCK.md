# OppSkills Mobile Phase 0 Scope Lock

Last updated: 2026-03-13
Owner: Mobile Engineering

## Delivery Boundary

1. Work is limited to `apps/oppmobile`.
2. No file or folder outside `apps/oppmobile` may be modified without explicit approval.
3. Current phase uses only local mock data.
4. Full authentication, live API calls, analytics, and deep linking are excluded.
5. Architecture must remain ready for future backend integration.

## In Scope

1. Welcome flow:
   - Intro Screen
   - Onboarding Screen 7
   - Onboarding Screen 8
   - Onboarding Screen 9
2. Sign-up and sign-in flow:
   - Sign Up
   - Verify Identity (OTP empty)
   - Verify Identity (OTP filled)
   - Profile Setup Personal
   - Profile Setup Education
   - Profile Setup Skills
   - Sign In
3. Core direct-canvas screens:
   - Home Page
   - Discover page
   - Applied
   - Discover Page Hackathons
   - Discover Page Competitions
   - Discover Page Events variant 1
   - Discover Page Events variant 2
   - Search Page Recent Searches
   - Search Page Popular Searches
   - Search Page Typing
   - Search Page Results
   - Competition Page
   - Hackathon Page
4. Three-tab mobile shell:
   - Home
   - Discover
   - Applied
5. Loading and empty states where needed.
6. Light theme implementation with dark-mode-ready contracts.
7. Android and iOS support.

## Exclusions

1. Production Clerk flow.
2. Real backend wiring.
3. Analytics.
4. Deep linking.
5. Changes to shared monorepo packages during this phase.

## Naming And Reuse Policy

1. Screen names should stay close to product language, not raw Figma IDs.
2. Shared building blocks belong in `src/shared/ui`.
3. Domain-specific screens, fixtures, and adapters belong in `src/domains/<domain>`.
4. Tokens, formatting helpers, and route constants must stay centralized.
5. Repeated card, chip, footer, and input patterns must be extracted once similarity is proven.

## Risk Register

1. Font parity risk: exact production fonts are not available yet, so fallback mappings will be used first.
2. Density parity risk: Figma exports are pixel-targeted for one device size and need responsive adaptation.
3. Long-scroll performance risk: feed-style screens must be designed around list virtualization.
4. Asset fidelity risk: exported PNG and SVG assets may require selective replacement with native primitives.
5. Navigation scope risk: routing must stay simple now without blocking later detail flows.

## Acceptance Gate

Phase 0 is complete when scope, exclusions, screen inventory, and acceptance rules are written down with no ambiguity.