# OppSkills Mobile Screen Acceptance Checklist

Use this checklist for every screen before moving status to `ready-for-review`.

## Visual Fidelity

- Layout hierarchy matches the approved design intent.
- Spacing and radius values use shared tokens.
- Typography uses shared text styles or mapped fallbacks.
- Colors use theme tokens rather than hardcoded hex values where reusable.
- Footer signature block matches the approved mobile pattern when required.

## Interaction

- Primary, secondary, and ghost actions are clearly wired.
- Touch targets are at least 44px where interactive.
- Scroll behavior feels stable and uninterrupted.
- Empty or loading states are present when the screen needs them.

## Data And Architecture

- Screen consumes local mock data only.
- Screen-specific state stays within its domain boundary.
- Repeated UI parts are extracted into shared components when justified.
- Route names and constants come from centralized config.

## Quality

- TypeScript passes for changed files.
- No placeholder copy remains unless intentionally tracked.
- Android and iOS layout assumptions are reasonable.
- Screen is ready for later backend mapping without structural rework.