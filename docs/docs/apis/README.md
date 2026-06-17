# API docs for client apps

Documents in this folder describe **HTTP contracts** for the OppSkills NestJS API (`apps/backend`). They are written for **web and mobile** consumers.

## Suggested reading order (React Native / Expo)

1. **[Mobile API client guide](./mobile-client-guide.md)** — TanStack Query, shared `fetch` wrapper, `getToken()`, cache invalidation, and production practices.
2. **[Authentication API](./auth.md)** — Clerk sessions, JWTs for `Authorization`, Expo vs Next.js, password reset.
3. **[Onboarding API](./onboarding.md)** — `CreateOnboardingDto` and related user-account routes; Clerk vs backend boundaries.
4. **[User Profile API](./user_profile.md)** — Profile, education, skills patches, registrations, transactions.

## Other references

- [Opportunities](./opportunities.md)
- [Organizer](./organizer.md) and `organizer/*.md`

Canonical monorepo overview: [../README.md](../README.md) and [../api.md](../api.md).
