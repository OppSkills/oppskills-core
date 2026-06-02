# Development Guide

This guide covers everything you need to develop locally on the OppSkills platform.

## Prerequisites

### Required Software

- **Node.js**: >= 18.x (LTS recommended)
- **pnpm**: 10.5.2 or higher
  ```bash
  npm install -g pnpm
  ```
- **Docker Desktop**: For PostgreSQL and Redis
- **Git**: For version control

### Optional Tools

- **Svix CLI**: For testing Clerk webhooks
  ```bash
  npm install -g svix-cli
  ```
- **Prisma Studio**: Included in the project

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd oppskills-core
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs dependencies for all packages in the monorepo.

### 3. Start Infrastructure

```bash
docker compose up -d
```

This starts:

- **PostgreSQL**: port 5434
- **Redis**: port 6380

Verify containers are running:

```bash
docker ps
```

### 4. Configure Environment Variables

#### Backend (`apps/backend/.env.local`)

```env
# Database
DATABASE_URL="postgresql://oppskills:oppskills@localhost:5434/oppskills?schema=oppskills"

# Clerk Authentication
CLERK_SECRET_KEY="sk_test_..." # Get from Clerk dashboard
CLERK_WEBHOOK_SECRET="whsec_..." # Get from Clerk webhook settings

# Redis
REDISHOST="localhost"
REDISPORT="6380"
REDISPASSWORD=""

# Admin Users (comma-separated Clerk user IDs)
ADMIN_USER_IDS="user_abc123,user_def456"

# Development Auth Bypass (NEVER use in production!)
AUTH_BYPASS="true"

# AWS S3 (optional for local development)
AWS_REGION="us-east-1"
MEDIA_S3_BUCKET="oppskills-media"
MEDIA_CLOUDFRONT_BASE_URL="https://cdn.oppskills.com"
MEDIA_MAX_UPLOAD_BYTES="10485760"
MEDIA_MAX_DOCUMENT_UPLOAD_BYTES="104857600"
MEDIA_ALLOWED_IMAGE_MIME_TYPES="image/jpeg,image/png,image/webp"
MEDIA_ALLOWED_DOCUMENT_MIME_TYPES="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,image/jpeg,image/png,image/webp"
RESEND_API_KEY="re_..."
RESEND_FROM_EMAIL="OppSkills <noreply@oppskills.com>"
```

#### Database (`packages/database/.env`)

```env
DATABASE_URL="postgresql://oppskills:oppskills@localhost:5434/oppskills?schema=oppskills"
```

#### Frontend (`apps/ui-webapp/.env.local`)

```env
# API URL
NEXT_PUBLIC_API_URL="http://localhost:3001"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..." # Get from Clerk dashboard
CLERK_SECRET_KEY="sk_test_..." # Same as backend

# PostHog Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY="phc_..." # Get from PostHog project settings
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com" # Optional, defaults to US instance

# Meet links shown in community scheduler
NEXT_PUBLIC_MEET_BASE_URL="http://localhost:3003"
```

#### Meet app (`apps/meet-webapp/.env.local`)

Uses the same Clerk application as `ui-webapp`.

```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

Production meet URLs: `https://meet.oppskills.com/[invite-code]`

#### Backend LiveKit (community meets)

Add to `apps/backend/.env.local`:

```env
# LiveKit Cloud — https://cloud.livekit.io
# Or use local dev server (see docker-compose livekit service):
LIVEKIT_API_KEY="devkey"
LIVEKIT_API_SECRET="secret"
LIVEKIT_URL="ws://localhost:7880"

# Public meet app base URL (used when creating meet links)
MEET_BASE_URL="http://localhost:3003"
```

Start local LiveKit SFU (optional, for development without LiveKit Cloud):

```bash
docker compose up -d livekit
```

Local dev uses API key `devkey` / secret `secret` (LiveKit `--dev` mode). For production, replace with credentials from your [LiveKit Cloud](https://cloud.livekit.io) project settings (`wss://your-project.livekit.cloud`).

Run the new migration after pulling meet changes:

```bash
pnpm db:migrate:deploy
# or locally: pnpm db:migrate
```

### 5. Set Up Database

Generate Prisma client:

```bash
pnpm db:generate
```

Push schema to database (development):

```bash
pnpm db:push
```

Or create a migration (production-ready):

```bash
pnpm db:migrate
```

### 6. Start Development Servers

Start all services:

```bash
pnpm dev
```

Or start individually:

```bash
# Backend only (port 3001)
pnpm dev:backend

# Frontend only (port 3000)
pnpm dev:ui-webapp

# Meet app only (port 3003)
pnpm dev:meet-webapp

# Prisma Studio (port 3008)
pnpm db:studio
```

### 7. Verify Setup

- **Frontend**: http://localhost:3000
- **Meet app**: http://localhost:3003
- **Backend**: http://localhost:3001
- **API Docs**: http://localhost:3001/api-reference
- **Prisma Studio**: http://localhost:3008 (if running)

## Essential Commands

### Development

```bash
# Start all services (backend + frontend)
pnpm dev

# Start backend only (runs on port 3001)
pnpm dev:backend

# Start frontend only (runs on port 3000)
pnpm dev:ui-webapp

# Start Prisma Studio (database GUI on port 3008)
pnpm db:studio
```

### Database Management

```bash
# Generate Prisma client (after schema changes)
pnpm db:generate

# Push schema changes without migration (dev only)
pnpm db:push

# Create and apply migration (production-ready)
pnpm db:migrate

# Apply migrations in production
pnpm db:migrate:deploy

# Reset database (WARNING: deletes all data!)
cd packages/database && pnpm prisma migrate reset

# Seed database (if seed script exists)
cd packages/database && pnpm prisma db seed
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

# Build database package
pnpm build --filter=@oppskills/db
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

### Infrastructure

```bash
# Start PostgreSQL and Redis via Docker
docker compose up -d

# Stop containers
docker compose down

# View logs
docker compose logs -f

# Restart containers
docker compose restart

# Remove containers and volumes (WARNING: deletes data!)
docker compose down -v
```

## Development Workflow

### Making Schema Changes

1. Edit the schema:

   ```bash
   vim packages/database/prisma/schema.prisma
   ```

2. Generate Prisma client:

   ```bash
   pnpm db:generate
   ```

3. Push changes (dev) or create migration (prod):

   ```bash
   # Development
   pnpm db:push

   # Production-ready migration
   pnpm db:migrate
   ```

4. Rebuild dependent packages:

   ```bash
   pnpm build --filter=@oppskills/db
   ```

5. Restart backend server (if running)

### Adding a New Feature

1. **Update Prisma schema** (if database changes needed):

   ```prisma
   // packages/database/prisma/schema.prisma
   model NewEntity {
     id        String   @id @default(cuid())
     name      String
     createdAt DateTime @default(now())
   }
   ```

2. **Generate Prisma client**:

   ```bash
   pnpm db:generate
   pnpm db:push
   ```

3. **Add/update types** (if sharing between apps):

   ```typescript
   // packages/types/src/dtos/backend/new-entity/create-new-entity.dto.ts
   export class CreateNewEntityDto {
     @IsString()
     @IsNotEmpty()
     name: string;
   }
   ```

4. **Implement backend logic**:

   ```typescript
   // apps/backend/src/new-entity/new-entity.module.ts
   @Module({
     controllers: [NewEntityController],
     providers: [NewEntityService],
   })
   export class NewEntityModule {}
   ```

5. **Create frontend components/pages**:

   ```typescript
   // apps/ui-webapp/src/app/dashboard/new-entity/page.tsx
   export default function NewEntityPage() {
     // Component code
   }
   ```

6. **Add API client functions**:

   ```typescript
   // apps/ui-webapp/src/lib/api/newEntityApi.ts
   export const createNewEntity = async (
     token: string,
     data: CreateNewEntityDto,
   ) => {
     const client = createApiClient("/new-entities");
     return client.post("/", data, { headers: buildAuthHeaders(token) });
   };
   ```

7. **Create TanStack Query hooks**:
   ```typescript
   // apps/ui-webapp/src/hooks/useNewEntities.ts
   export const useCreateNewEntity = () => {
     return useMutation({
       mutationFn: (data: CreateNewEntityDto) => createNewEntity(token, data),
     });
   };
   ```

### Turbo Build Dependencies

Build order matters! Turborepo handles this automatically:

```
packages/types (build)
    ↓
packages/database (build + generate)
    ↓
apps/backend (build)
apps/ui-webapp (build)
```

**Important**: Always rebuild dependent packages after changes:

```bash
# After types change
pnpm build --filter=@oppskills/types

# After database schema change
pnpm db:generate
pnpm build --filter=@oppskills/db
```

## Testing Locally

### Backend API Testing

#### Using Swagger UI

1. Navigate to http://localhost:3001/api-reference
2. Click "Authorize" and enter Clerk JWT token
3. Test endpoints directly in the UI

#### Using curl

```bash
# Get all hackathons
curl -H "Authorization: Bearer YOUR_CLERK_JWT" \
  http://localhost:3001/hackathons

# Create hackathon
curl -X POST \
  -H "Authorization: Bearer YOUR_CLERK_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Hackathon","description":"Test"}' \
  http://localhost:3001/hackathons
```

#### Using Auth Bypass (Development Only)

```bash
# Set AUTH_BYPASS=true in apps/backend/.env.local

# Use x-user-id header instead of Bearer token
curl -H "x-user-id: test-user-123" \
  http://localhost:3001/hackathons
```

### Frontend Testing

1. Start frontend: `pnpm dev:ui-webapp`
2. Navigate to http://localhost:3000
3. Sign in with Clerk (requires valid Clerk credentials)
4. Test features in the UI

### Webhook Testing

#### Clerk Webhooks (User Events)

1. Install Svix CLI:

   ```bash
   npm install -g svix-cli
   ```

2. Start webhook listener:

   ```bash
   svix listen http://localhost:3001/user-accounts/clerk-webhook
   ```

3. Copy the webhook URL from Svix output

4. In Clerk Dashboard:
   - Go to Webhooks
   - Create endpoint
   - Use Svix URL as endpoint
   - Enable events: `user.created`, `user.updated`, `user.deleted`

5. Test by creating/updating users in Clerk

## Debugging

### Backend Debugging (VS Code)

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["--filter", "backend", "start:debug"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Frontend Debugging

Use React DevTools and browser DevTools:

- **React DevTools**: Install browser extension
- **TanStack Query DevTools**: Automatically enabled in dev mode
- **Network Tab**: Monitor API calls

### Database Debugging

#### Prisma Studio

```bash
pnpm db:studio
```

Visual database browser on http://localhost:3008

#### Direct SQL

```bash
docker exec -it oppskills-postgres psql -U oppskills -d oppskills

# Inside psql
\c oppskills
SET search_path TO oppskills;
SELECT * FROM "UserEntity";
```

#### Prisma Query Logs

Add to `packages/database/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

### Redis Debugging

Connect to Redis CLI:

```bash
docker exec -it oppskills-redis redis-cli -p 6380

# Inside redis-cli
KEYS *           # List all keys
GET key_name     # Get value
FLUSHALL         # Clear all keys (WARNING!)
```

## Common Issues & Solutions

### Issue: Prisma Client Not Generated

**Solution**:

```bash
pnpm db:generate
```

### Issue: Database Schema Mismatch

**Solution**:

```bash
pnpm db:push  # Dev
# OR
pnpm db:migrate  # Production
```

### Issue: Port Already in Use

**Solution**:

```bash
# Find process using port
lsof -i :3001  # Backend
lsof -i :3000  # Frontend

# Kill process
kill -9 <PID>
```

### Issue: Docker Containers Not Starting

**Solution**:

```bash
docker compose down
docker compose up -d
docker compose logs
```

### Issue: Auth Bypass Not Working

**Solution**:

- Verify `AUTH_BYPASS=true` in `apps/backend/.env.local`
- Ensure you're not in production environment
- Use `x-user-id` header instead of `Authorization` header

### Issue: Type Errors After Schema Change

**Solution**:

```bash
pnpm db:generate
pnpm build --filter=@oppskills/db
pnpm build --filter=@oppskills/types
```

### Issue: Frontend API Calls Failing

**Solution**:

1. Verify `NEXT_PUBLIC_API_URL` in `apps/ui-webapp/.env.local`
2. Check backend is running: `curl http://localhost:3001`
3. Check CORS settings in `apps/backend/src/main.ts`

### Issue: Migrations Failing

**Solution**:

```bash
# Reset and reapply migrations (WARNING: deletes data!)
cd packages/database
pnpm prisma migrate reset

# Or manually fix migration files in packages/database/prisma/migrations/
```

## Performance Tips

### Fast Rebuilds

```bash
# Use Turbo cache
pnpm build --filter=backend  # Only rebuild backend

# Clear Turbo cache if issues
rm -rf .turbo
```

### Fast Database Resets

```bash
# Use db:push in development (no migration files)
pnpm db:push

# Only use db:migrate for production-ready changes
pnpm db:migrate
```

### Fast Frontend Hot Reload

- Next.js 16 uses Turbopack by default (faster than Webpack)
- Avoid importing large libraries on every page
- Use dynamic imports for heavy components

## Environment-Specific Workflows

### Local Development

- Use `AUTH_BYPASS=true` for fast testing
- Use `pnpm db:push` for quick schema changes
- Use Docker Compose for infrastructure

### Staging/Production

- Never use `AUTH_BYPASS`
- Always use `pnpm db:migrate` for schema changes
- Use managed services (RDS, ElastiCache, S3)
- Load secrets from AWS Secrets Manager

## VS Code Extensions (Recommended)

- **Prisma**: Syntax highlighting for `.prisma` files
- **ESLint**: Linting
- **Prettier**: Code formatting
- **Tailwind CSS IntelliSense**: Tailwind class autocomplete
- **GitLens**: Git blame and history
- **Error Lens**: Inline error messages

## Git Workflow

### Branch Naming

```
feature/add-new-entity
fix/authentication-bug
chore/update-dependencies
docs/api-reference
```

### Commit Messages

```
feat: add new entity module
fix: resolve authentication bug
chore: update dependencies
docs: update API reference
refactor: extract common logic
test: add unit tests for service
```

### Pull Request Process

1. Create feature branch from `main`
2. Make changes and commit
3. Push to GitHub
4. Create pull request
5. Wait for CI checks
6. Request review
7. Merge to `main`

## CI/CD Pipeline

### GitHub Actions Workflows

1. **Deploy Backend** (`.github/workflows/deploy-backend-ec2.yml`)
   - Triggers on push to `main`
   - Builds Docker image
   - Deploys to EC2

2. **Run Migrations** (`.github/workflows/run-migrations-ec2.yml`)
   - Triggers manually
   - Runs Prisma migrations on production database

3. **Deploy Frontend** (`.github/workflows/deploy-vercel.yml`)
   - Triggers on push to `main`
   - Deploys to Vercel

## Package Scripts Reference

### Root Level

```bash
pnpm dev                # Start all dev servers
pnpm build              # Build all packages
pnpm lint               # Lint all packages
pnpm format             # Format all files
pnpm check-types        # Type check all packages
pnpm db:generate        # Generate Prisma client
pnpm db:push            # Push schema (dev)
pnpm db:migrate         # Create migration (prod)
pnpm db:studio          # Open Prisma Studio
```

### Backend (`apps/backend/`)

```bash
pnpm start              # Start production build
pnpm start:dev          # Start watch mode (nodemon)
pnpm start:debug        # Start debug mode
pnpm test               # Run tests
pnpm test:watch         # Run tests in watch mode
pnpm test:cov           # Run tests with coverage
pnpm test:e2e           # Run e2e tests
```

### Frontend (`apps/ui-webapp/`)

```bash
pnpm dev                # Start dev server (Turbopack)
pnpm build              # Build for production
pnpm start              # Start production server
pnpm lint               # Lint frontend code
```

### Meet app (`apps/meet-webapp/`)

```bash
pnpm dev                # Start dev server on port 3003
pnpm build              # Build for production
pnpm start              # Start production server on port 3003
```

#### Deploying `meet.oppskills.com`

1. Create a Vercel project with root directory `apps/meet-webapp`.
2. Add domain `meet.oppskills.com` (CNAME to Vercel).
3. Set env vars: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` (same Clerk app as main webapp).
4. Set backend `MEET_BASE_URL=https://meet.oppskills.com` and LiveKit secrets in production.
5. Ensure backend CORS includes `https://meet.oppskills.com` (already configured in `apps/backend/src/main.ts`).

## Next Steps

- Read [API Reference](./api.md) for available endpoints
- Read [Database Schema](./database.md) for data model details
- Read [Authentication](./authentication.md) for auth setup
- Read [Features](./features.md) for business logic implementation
