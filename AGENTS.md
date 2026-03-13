# AGENTS.md (OppSkills Core)

OppSkills Core is a Turborepo monorepo:

- Backend API: `apps/backend` (NestJS, Jest, Prisma via `@oppskills/db`)
- Frontend UI: `apps/ui-webapp` (Next.js App Router)
- Shared packages: `packages/types`, `packages/database`

## Docs / Reference

- Agent-oriented project notes: `CLAUDE.md` (quick reference + pointers).
- Canonical docs live in `docs/` (start at `docs/README.md`).
  - `docs/development.md` (local setup + workflows)
  - `docs/architecture.md` (system design)
  - `docs/api.md` (endpoint reference)
  - `docs/authentication.md` (Clerk + security)
  - `docs/database.md` (schema details)
  - `docs/backend.md`, `docs/frontend.md` (app structure)

## Agent Rule Files

- Cursor rules: none found in `.cursor/rules/**`.
- Cursor legacy: none found in `.cursorrules`.
- Copilot rules: none found in `.github/copilot-instructions.md`.

If you add any of the above later, update this file.

## Commands (from repo root)

### Install

- `pnpm install`

### Dev

- `pnpm dev` (all apps)
- `pnpm dev:backend` (API on `:3001`)
- `pnpm dev:ui-webapp` (UI on `:3000`)

### Build

- `pnpm build` (all)
- `pnpm build:backend`
- `pnpm build:ui-webapp`
- If shared code changed, build in order:
  - `pnpm build --filter=@oppskills/types`
  - `pnpm db:generate` (after Prisma schema changes)
  - `pnpm build --filter=@oppskills/db`

### Lint / Format

- `pnpm lint` (turbo)
- `pnpm format` (root Prettier: `prettier --write "**/*.{ts,tsx,md}"`)
- Backend-only: `pnpm -C apps/backend lint`, `pnpm -C apps/backend format`
- UI-only: `pnpm -C apps/ui-webapp lint`

### Typecheck

- `pnpm check-types` (turbo)

### Tests (Backend / Jest)

- All unit tests: `pnpm -C apps/backend test`
- Watch mode: `pnpm -C apps/backend test:watch`
- Coverage: `pnpm -C apps/backend test:cov`
- E2E: `pnpm -C apps/backend test:e2e`

Run a single unit test file:

- `pnpm -C apps/backend test -- src/common/clerk-auth.guard.spec.ts`
- `pnpm -C apps/backend test -- app.controller.spec.ts`

Run a single test by name:

- `pnpm -C apps/backend test -- -t "ClerkAuthGuard"`
- `pnpm -C apps/backend test -- -t "should be defined"`

Run a single e2e test file:

- `pnpm -C apps/backend test:e2e -- app.e2e-spec.ts`

Debug a single test:

- `pnpm -C apps/backend test:debug -- -t "ClerkAuthGuard"`

## Database / Prisma

- Generate Prisma client: `pnpm db:generate`
- Push schema (dev): `pnpm db:push`
- Create/apply migration (dev): `pnpm db:migrate`
- Deploy migrations (prod): `pnpm db:migrate:deploy`
- Prisma Studio: `pnpm db:studio` (port `3008`)

Notes:

- PostgreSQL schema is `oppskills` (not `public`).
- After editing `packages/database/prisma/schema.prisma`, run `pnpm db:generate`.

## Code Style (repo-wide)

### General

- Prefer `pnpm` and Turbo scripts from root.
- Keep changes scoped; avoid drive-by refactors.
- Prefer readable code over abstractions.

### Formatting

- Backend (`apps/backend`) Prettier settings: `singleQuote: true`, `trailingComma: all`.
- UI and packages: follow local file style (many UI files use double quotes).
- Prefer running formatters over manual formatting.

### Imports

- Use `import type { ... }` for type-only imports.
- Prefer absolute imports where configured:
 - UI: `@/...` → `apps/ui-webapp/src/*`
  - Backend Jest: `^src/(.*)$` → `apps/backend/src/*`
- Import grouping (preferred):
  1. Node built-ins
  2. External deps
  3. Workspace packages (`@oppskills/*`)
  4. App absolute imports (`src/...` or `@/...`)
  5. Relative imports

### Naming

- `PascalCase` for classes/types/enums; `camelCase` for functions/variables.
- `SCREAMING_SNAKE_CASE` only for true constants.
- Backend files: Nest conventions (`*.controller.ts`, `*.service.ts`, `*.module.ts`, `*.dto.ts`).
- UI files: Next.js App Router in `src/app/**`; components often `PascalCase`.

### Types

- Prefer explicit return types on exported functions (esp. API helpers).
- Avoid `any` unless unavoidable (backend allows; UI warns).
- Prefer `unknown` at boundaries, then narrow with type guards.

### Backend (NestJS)

- Keep controllers thin; business logic in services.
- Prefer Nest exceptions for HTTP errors (`BadRequestException`, `UnauthorizedException`, etc.).
- Logging: prefer `new Logger(MyClass.name)` from `apps/backend/src/_utils/logger.ts`; avoid `console.*`.
- Promises: don’t ignore promises (`@typescript-eslint/no-floating-promises` warns).

Dev auth bypass:

- `AUTH_BYPASS=true` (dev/test only) enables `x-user-id` header auth.
- Never rely on this in production; keep dev-only safety checks.

### Frontend (Next.js UI)

- Use Server/Client Components correctly; add `'use client'` only when needed.
 - Data fetching: prefer API helpers in `apps/ui-webapp/src/lib/api/*` and TanStack Query hooks in `apps/ui-webapp/src/hooks/*`.
- Auth: use Clerk helpers (`useAuth`, `useSignIn`) and pass tokens per request.
- Errors: show toasts (`sonner`) for expected UX failures; throw `Error` for programmer errors (missing slug/token).

## Editing Workflow Tips

- If you change `packages/types`, rebuild it before apps.
- If you change Prisma schema, run `pnpm db:generate`, then rebuild `@oppskills/db`.
- Add/adjust backend tests when changing backend behavior.
