# CLAUDE.md

This file provides quick reference guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comprehensive Documentation

For detailed documentation, see the `docs/` folder:

- **[Documentation Index](./docs/README.md)** - Start here for navigation
- **[Architecture Overview](./docs/architecture.md)** - System design, tech stack, and data flow
- **[Development Guide](./docs/development.md)** - Local setup, commands, and workflows
- **[Database Schema](./docs/database.md)** - Complete schema reference with all entities and relationships
- **[Backend Documentation](./docs/backend.md)** - NestJS modules, services, and business logic
- **[Frontend Documentation](./docs/frontend.md)** - Next.js app structure, components, and hooks
- **[API Reference](./docs/api.md)** - All endpoints with request/response examples
- **[Authentication & Authorization](./docs/authentication.md)** - Clerk integration and security
- **[Features & Business Logic](./docs/features.md)** - Key workflows and implementation patterns
- **[Deployment Guide](./docs/deployment.md)** - Infrastructure, CI/CD, and production deployment

## Project Overview

OppSkills is a Turborepo monorepo managing hackathons, festivals, and teams. It consists of:

- **Backend**: NestJS API (`apps/backend`)
- **Frontend**: Next.js web app (`apps/ui-webapp`)
- **Packages**: Shared database (`@oppskills/db`) and types (`@oppskills/types`)

## Essential Commands

### Development

```bash
# Start all services
pnpm dev

# Start backend only (runs on port 3001)
pnpm dev:backend

# Start frontend only
pnpm dev:ui-webapp

# Start Prisma Studio (database GUI on port 3008)
pnpm db:dev
```

### Database Management

```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes without migration (dev only)
pnpm db:push

# Create and apply migration
pnpm db:migrate

# Apply migrations in production
pnpm db:migrate:deploy

# Open Prisma Studio
pnpm db:studio
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:backend
pnpm build:ui-webapp

# Build types package (required before other builds)
pnpm build --filter=@oppskills/types
```

### Testing (Backend)

```bash
# Run all tests
cd apps/backend && pnpm test

# Run tests in watch mode
cd apps/backend && pnpm test:watch

# Run e2e tests
cd apps/backend && pnpm test:e2e

# Run with coverage
cd apps/backend && pnpm test:cov

# Debug tests
cd apps/backend && pnpm test:debug
```

### Linting & Formatting

```bash
# Lint all packages
pnpm lint

# Format all files
pnpm format

# Type check all packages
pnpm check-types
```

### Local Infrastructure

```bash
# Start PostgreSQL and Redis via Docker
docker compose up -d

# PostgreSQL runs on port 5434
# Redis runs on port 6380
```

### Webhook Development

```bash
# Listen to Clerk webhooks (requires svix CLI)
svix listen http://localhost:3001/user-accounts/clerk-webhook
```

## Architecture

### Data Model Hierarchy

The application uses a **hierarchical event structure**:

- **Festivals** are top-level events (e.g., tech conferences)
- **Hackathons** can be standalone OR belong to a festival
- **Rounds** belong to hackathons (e.g., Round 1, Round 2, Finals)
- **Teams** participate in hackathons
- **Users** create events and join teams

Key relationships:

- `FestivalEntity` → has many `HackathonEntity` (via `festivalId`)
- `HackathonEntity` → has many `RoundEntity`, `TeamEntity`, `PrizeBreakdownEntity`
- `TeamEntity` → has many `TeamMemberEntity`
- All entities track their creator via `ownerId` or `organizerId`

### Authentication & Authorization

**Clerk Integration:**

- Primary authentication via Clerk (JWT tokens)
- `ClerkAuthGuard` validates Bearer tokens or query param tokens
- Extracts user from JWT `sub` claim and attaches to `request.user`
- Webhook endpoint syncs Clerk user events to database

**Auth Bypass (Development Only):**

- Set `AUTH_BYPASS=true` in non-production environments
- Pass `x-user-id` header to bypass Clerk (auto-creates users)
- Security check prevents bypass in production

**Authorization Levels:**

- `AccessLevel.ADMIN` - Full system access
- `AccessLevel.USER` - Standard user (default)
- `AccessLevel.VIEWER` - Read-only access
- Admin users configured via `ADMIN_USER_IDS` environment variable (comma-separated)

### Backend Structure

**Module Organization:**

- `UserAccountsModule` - Clerk webhook handling, user sync
- `HackathonModule` - Hackathon CRUD, rounds, registration
- `FestivalModule` - Festival CRUD
- `TeamModule` - Team management
- `CommonModule` - Shared guards, config, caching (Redis)

**Key Services:**

- `ClerkAuthConfigService` - Environment config (Clerk, Redis, admin IDs)
- `CacheService` - Redis-based caching layer
- `HackathonService` - Complex business logic for hackathons
- `FestivalService` - Festival management

### Frontend Structure

Next.js app with:

- App Router (`src/app/`)
- Components (`src/components/`)
- API integration via TanStack Query (`src/hooks/`)
- Clerk authentication (`@clerk/nextjs`)
- Tailwind CSS + Radix UI components

### Shared Packages

**@oppskills/db:**

- Prisma client and schema
- Single source of truth for database
- Exports generated Prisma client
- Uses `oppskills` PostgreSQL schema

**@oppskills/types:**

- Shared TypeScript types/DTOs
- Uses `class-validator` and `class-transformer`
- Imported by both frontend and backend

## Development Workflow

### Making Schema Changes

1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:generate` to update Prisma client
3. Run `pnpm db:push` (dev) or `pnpm db:migrate` (production-ready migration)
4. Rebuild dependent packages: `pnpm build --filter=@oppskills/db`

### Adding New Features

1. Update Prisma schema if database changes needed
2. Add/update types in `packages/types/src/` if sharing between apps
3. Implement backend logic in appropriate module (`apps/backend/src/`)
4. Create frontend components/pages in `apps/ui-webapp/src/`
5. Use TanStack Query for API calls on frontend

### Turbo Build Dependencies

- `dev` tasks depend on `^build` (build dependencies first)
- `build` tasks depend on `^build` (build in dependency order)
- Database package must be built before backend
- Types package should be built before other packages when modified

## Environment Variables

**Backend (apps/backend/.env.local):**

- `DATABASE_URL` - PostgreSQL connection string
- `CLERK_SECRET_KEY` - Clerk secret key (sk*test*_ or sk*live*_)
- `CLERK_WEBHOOK_SECRET` - Clerk webhook signing secret
- `REDISHOST` - Redis host (default: localhost)
- `REDISPORT` - Redis port (default: 6379)
- `REDISPASSWORD` - Redis password
- `ADMIN_USER_IDS` - Comma-separated Clerk user IDs with admin access
- `AUTH_BYPASS` - Set to "true" to enable dev auth bypass

**Database (packages/database/.env):**

- `DATABASE_URL` - PostgreSQL connection string

**Production Secrets:**

- Loaded from AWS Secrets Manager via `load-secrets.mts`
- Only runs when `NODE_ENV !== 'local'`
- Uses IAM role credentials from container metadata

## Important Patterns

### Lifecycle Status

Entities use `LifecycleStatus` enum:

- `DRAFT` - Being created, not visible
- `PUBLISHED` - Public and accepting registrations
- `ONGOING` - Event is happening
- `COMPLETED` - Event finished
- `CANCELLED` - Event cancelled

### Visibility Control

Hackathons support:

- `PUBLIC` - Anyone can see and register
- `PRIVATE` - Invitation only
- `UNIVERSITY_ONLY` - Restricted to `allowedUniversities` list

### Location Handling

Both festivals and hackathons store location as:

- `locationType`: `PHYSICAL` or `VIRTUAL`
- Physical: `locationAddress`, `locationCity`
- Virtual: `locationVirtualLink`

### Registration Forms

Hackathons can have optional `RegistrationFormEntity` with:

- Custom fields via `RegistrationFieldEntity`
- Field types: TEXT, PHONE_NO, EMAIL, NUMBER, ATTACHMENTS, OPTIONS
- External form link support

## Testing Locally

1. Start infrastructure: `docker compose up -d`
2. Set up database: `pnpm db:push` (first time)
3. Generate Prisma client: `pnpm db:generate`
4. Start backend: `pnpm dev:backend`
5. Start frontend: `pnpm dev:ui-webapp`
6. (Optional) Start Svix webhook listener for Clerk events

Backend runs on http://localhost:3001
Frontend runs on http://localhost:3000

## Key Gotchas

- Always run `pnpm db:generate` after schema changes
- Build order matters: types/db → backend/frontend
- Backend requires Redis for caching (configure via REDIS\* env vars)
- Clerk webhook needs proper signature verification in production
- Auth bypass only works in development/test environments
- Custom PostgreSQL schema name is "oppskills" (not "public")

---

## Need More Information?

This file provides a quick reference. For comprehensive documentation on any topic, see the **[docs/](./docs/)** folder:

- Architecture & Design → [docs/architecture.md](./docs/architecture.md)
- Development Setup → [docs/development.md](./docs/development.md)
- Database Schema → [docs/database.md](./docs/database.md)
- Backend Implementation → [docs/backend.md](./docs/backend.md)
- Frontend Implementation → [docs/frontend.md](./docs/frontend.md)
- API Endpoints → [docs/api.md](./docs/api.md)
- Authentication → [docs/authentication.md](./docs/authentication.md)
- Features & Workflows → [docs/features.md](./docs/features.md)
- Deployment → [docs/deployment.md](./docs/deployment.md)
