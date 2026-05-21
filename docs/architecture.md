# Architecture Overview

## System Architecture

OppSkills is a full-stack TypeScript monorepo built with Turborepo, consisting of separate frontend and backend applications with shared packages.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  Next.js 16 App (React 19, Tailwind CSS, Clerk Auth)       │
│  - App Router (SSR + Client Components)                     │
│  - TanStack Query (API state management)                    │
│  - Radix UI + Custom Components                             │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTPS (REST API)
                  │ Bearer Token (Clerk JWT)
┌─────────────────▼───────────────────────────────────────────┐
│                   API Layer (NestJS 11)                      │
│  - Controllers (REST endpoints)                              │
│  - Services (Business logic)                                 │
│  - Guards (Auth + Authorization)                             │
│  - DTOs (Validation with class-validator)                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┬─────────────┐
        │                   │             │
┌───────▼────────┐  ┌───────▼──────┐  ┌──▼──────────┐
│   PostgreSQL   │  │    Redis     │  │  Clerk API  │
│  (Port 5434)   │  │  (Port 6380) │  │  (Auth)     │
│  Prisma ORM    │  │  Caching     │  │  JWT Verify │
└────────────────┘  └──────────────┘  └─────────────┘
        │
┌───────▼────────┐
│   AWS S3 +     │
│  CloudFront    │
│ (Media Files)  │
└────────────────┘
```

## Monorepo Structure

```
oppskills-core/
├── apps/
│   ├── backend/          # NestJS API server
│   │   ├── src/
│   │   │   ├── common/           # Guards, config, cache
│   │   │   ├── hackathon/        # Hackathon module
│   │   │   ├── festival/         # Festival module
│   │   │   ├── team/             # Team module
│   │   │   ├── media/            # File upload module
│   │   │   ├── user-accounts/    # User & webhook module
│   │   │   └── main.ts           # Application entry point
│   │   ├── Dockerfile.prod       # Production Docker image
│   │   └── package.json
│   │
│   └── ui-webapp/        # Next.js frontend
│       ├── src/
│       │   ├── app/              # App Router pages
│       │   ├── components/       # React components
│       │   ├── lib/              # API clients, utilities
│       │   ├── hooks/            # React hooks (TanStack Query)
│       │   └── _actions/         # Server actions
│       └── package.json
│
├── packages/
│   ├── database/         # Prisma schema & client
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Database schema (source of truth)
│   │   └── package.json
│   │
│   └── types/            # Shared TypeScript types
│       ├── src/dtos/             # DTOs for API validation
│       └── package.json
│
├── deploy/               # Deployment configurations
├── scripts/              # Utility scripts (AWS secrets)
├── .github/workflows/    # CI/CD pipelines
└── turbo.json            # Turborepo configuration
```

## Tech Stack

### Frontend

- **Framework**: Next.js 16.0.7 (App Router, Turbopack)
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS 4 + Radix UI primitives
- **State Management**: TanStack Query 5.90.9
- **Authentication**: Clerk Next.js 6.32.0
- **Forms**: react-hook-form
- **Rich Text**: TipTap 3.13.0 (ProseMirror-based)
- **Charts**: Recharts 3.5.1
- **Date Handling**: date-fns 4.1.0, react-day-picker 9.12.0
- **URL State**: nuqs 2.8.5

### Backend

- **Framework**: NestJS 11
- **Language**: TypeScript 5.8.3
- **Validation**: class-validator + class-transformer
- **ORM**: Prisma 6.2.3
- **Caching**: ioredis (Redis client)
- **API Docs**: @nestjs/swagger (OpenAPI)
- **Authentication**: Clerk JWT verification

### Database & Infrastructure

- **Database**: PostgreSQL (custom schema: "oppskills")
- **Cache**: Redis
- **File Storage**: AWS S3 + CloudFront CDN
- **Secrets**: AWS Secrets Manager
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**:
  - Frontend: Vercel
  - Backend: AWS EC2 (Docker)

### Build Tools

- **Monorepo**: Turborepo 2.5.1
- **Package Manager**: pnpm 10.5.2
- **Node Version**: >=18

## Data Flow Patterns

### 1. Read Operations (GET)

```
User Request → Next.js Page
    ↓
TanStack Query Hook (useHackathons, etc.)
    ↓
API Client (lib/api/hackathonApi.ts)
    ↓
Axios Request + Clerk JWT Token
    ↓
NestJS Controller (@Get decorator)
    ↓
ClerkAuthGuard (JWT verification)
    ↓
Service Layer (business logic)
    ↓
Prisma Client (database query)
    ↓
PostgreSQL
    ↓
Response → TanStack Query Cache → React Component
```

### 2. Write Operations (POST/PUT)

```
User Form Submission → React Component
    ↓
Form Validation (react-hook-form)
    ↓
Mutation Hook (useMutation from TanStack Query)
    ↓
API Client Function (createHackathon, etc.)
    ↓
NestJS Controller (@Post/@Put decorator)
    ↓
ClerkAuthGuard + AdminGuard/OwnershipCheck
    ↓
DTO Validation (class-validator)
    ↓
Service Layer (business logic + transactions)
    ↓
Prisma Client (database mutation)
    ↓
PostgreSQL
    ↓
Response → TanStack Query Cache Invalidation → UI Update
```

### 3. File Upload Flow

```
User Selects File → Frontend Component
    ↓
Request Presigned URL (POST /media/presign-image-upload)
    ↓
Backend Generates S3 Presigned POST (60s expiry)
    ↓
Frontend Uploads Directly to S3 (bypasses backend)
    ↓
S3 Returns Success
    ↓
Frontend Receives CloudFront Public URL
    ↓
Store URL in Database (e.g., hackathon.bannerImageUrl)
```

### 4. Authentication Flow

```
User Clicks Sign In → Clerk Component
    ↓
Clerk OAuth Flow (Google, GitHub, Email)
    ↓
Clerk Creates Session + JWT Token
    ↓
JWT Stored in Browser (HttpOnly Cookie)
    ↓
Clerk Webhook → Backend (/user-accounts/clerk-webhook)
    ↓
Backend Syncs User to Database (UserEntity)
    ↓
Subsequent API Requests Include JWT in Authorization Header
    ↓
ClerkAuthGuard Verifies JWT + Extracts userId
    ↓
Request Proceeds with request.user = { id, email }
```

## Hierarchical Data Model

The application uses a **hierarchical event structure**:

```
FestivalEntity (Top-level event)
    ↓ festivalId (nullable)
HackathonEntity (Can be standalone or festival-nested)
    ↓ hackathonId
    ├─── RoundEntity (Multiple rounds per hackathon)
    ├─── TeamEntity (Multiple teams per hackathon)
    │       ↓ teamId
    │       └─── TeamMemberEntity (Multiple members per team)
    ├─── PrizeBreakdownEntity (Prize tiers)
    ├─── RegistrationFormEntity (Custom fields)
    │       ↓ formId
    │       └─── RegistrationFieldEntity (Custom fields)
    ├─── HackathonAttachmentEntity (Uploaded files)
    └─── HackathonUserRoleEntity (Managers & Evaluators)
```

## Module Architecture (Backend)

### CommonModule

- **Purpose**: Shared services and guards
- **Exports**:
  - `ClerkAuthConfigService` - Environment configuration
  - `ClerkAuthGuard` - JWT authentication
  - `AdminGuard` - Admin-only access
  - `CacheService` - Redis caching layer

### UserAccountsModule

- **Purpose**: User management and Clerk integration
- **Features**:
  - Clerk webhook handler (user.created, user.updated, user.deleted)
  - User search for role assignment
  - Signature verification (Svix HMAC)

### HackathonModule

- **Purpose**: Hackathon CRUD and management
- **Features**:
  - Full lifecycle management (DRAFT → PUBLISHED → ONGOING → COMPLETED)
  - Nested resource updates (rounds, prizes, registration forms)
  - Role-based access (owner, manager, admin)
  - Registration handling

### FestivalModule

- **Purpose**: Festival CRUD
- **Features**:
  - Festival creation and management
  - Nested hackathon association
  - Lifecycle management

### TeamModule

- **Purpose**: Team creation and membership
- **Features**:
  - Team creation with max teams enforcement
  - Join/leave team functionality
  - Leader and member management

### MediaModule

- **Purpose**: File upload orchestration
- **Features**:
  - S3 presigned POST generation
  - Image and document upload support
  - CloudFront URL generation

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Users (HTTPS)                         │
└────────────────┬────────────────────────────────────────┘
                 │
        ┌────────┴─────────┐
        │                  │
┌───────▼──────┐   ┌───────▼────────┐
│   Vercel     │   │   AWS EC2      │
│  (Frontend)  │   │  (Backend API) │
│  Next.js App │   │  Docker + NestJS│
└──────────────┘   └───────┬────────┘
                           │
                  ┌────────┴─────────┬──────────────┐
                  │                  │              │
          ┌───────▼────────┐  ┌──────▼──────┐  ┌───▼────────┐
          │  AWS RDS       │  │  ElastiCache│  │ AWS S3 +   │
          │  (PostgreSQL)  │  │  (Redis)    │  │ CloudFront │
          └────────────────┘  └─────────────┘  └────────────┘
                  │
          ┌───────▼────────┐
          │ AWS Secrets    │
          │   Manager      │
          └────────────────┘
```

### Local Development

```
┌─────────────────────────────────────────────────────────┐
│              Developer Machine (localhost)               │
├─────────────────────────────────────────────────────────┤
│  Next.js Dev Server (port 3000)                         │
│  NestJS Dev Server (port 3001)                          │
│  Prisma Studio (port 3008)                              │
├─────────────────────────────────────────────────────────┤
│  Docker Compose:                                         │
│  - PostgreSQL (port 5434)                               │
│  - Redis (port 6380)                                    │
└─────────────────────────────────────────────────────────┘
```

## Security Architecture

### Authentication Layers

1. **Clerk JWT**: Primary authentication via Bearer tokens
2. **Auth Bypass**: Development-only mode (x-user-id header)
3. **Webhook Verification**: HMAC signature validation (Svix)

### Authorization Model

- **Admin**: Full system access (configured via `ADMIN_USER_IDS`)
- **Owner**: Full control over owned resources
- **Manager**: Can edit hackathons in DRAFT status
- **Evaluator**: Read-only (future implementation)
- **User**: Standard user permissions

### Request Security

- **CORS**: Production domains whitelisted
- **Validation**: Global ValidationPipe + class-validator
- **SQL Injection**: Parameterized queries (Prisma)
- **File Upload**: Presigned URLs (no direct upload to backend)

## Build & Dependency Graph

```
Turborepo Build Order:

packages/types (build) ──────────┐
                                 │
packages/database (build) ───────┼────────┐
   ↓ (db:generate)               │        │
                                 │        │
apps/backend (build) ────────────┘        │
   ↑ depends on: @oppskills/db, @oppskills/types
                                          │
apps/ui-webapp (build) ──────────────────┘
   ↑ depends on: @oppskills/types
```

**Dev Mode Dependencies**:

- All `dev` tasks depend on `^build` (build dependencies first)
- Database package must be built before backend
- Types package should be built before other packages

## Caching Strategy

### Backend Cache (Redis)

- **Purpose**: API response caching, session storage (future)
- **Implementation**: CacheService with JSON support
- **Status**: Infrastructure ready, not actively used yet

### Frontend Cache (TanStack Query)

- **Purpose**: API response caching, optimistic updates
- **Features**:
  - Automatic background refetching
  - Cache invalidation on mutations
  - Stale-while-revalidate pattern

## API Design Patterns

### RESTful Conventions

- **Resources**: `/hackathons`, `/festivals`, `/teams`
- **Nested Resources**: `/hackathons/:id/rounds`
- **Actions**: `/hackathons/:id/register`
- **Status Updates**: `PATCH /hackathons/:id/status`

### Response Format

```typescript
// Success (200/201)
{
  id: "...",
  name: "...",
  // ... resource fields
}

// Error (400/403/404/500)
{
  statusCode: 400,
  message: "Validation failed",
  error: "Bad Request"
}
```

### Authentication Header

```
Authorization: Bearer <clerk-jwt-token>
```

## Key Design Decisions

### 1. Monorepo Strategy

- **Decision**: Turborepo with separate apps + shared packages
- **Rationale**: Type safety, code reuse, atomic changes
- **Trade-off**: Build complexity vs. maintainability

### 2. Database ORM

- **Decision**: Prisma over TypeORM/Sequelize
- **Rationale**: Type safety, migrations, introspection
- **Trade-off**: Performance vs. developer experience

### 3. Authentication Provider

- **Decision**: Clerk over Auth0/Cognito
- **Rationale**: Developer experience, built-in UI, webhooks
- **Trade-off**: Vendor lock-in vs. time to market

### 4. File Upload Strategy

- **Decision**: Presigned URLs over direct upload
- **Rationale**: Scalability, reduced backend load
- **Trade-off**: Complexity vs. performance

### 5. Frontend State Management

- **Decision**: TanStack Query over Redux
- **Rationale**: Server state management, caching, less boilerplate
- **Trade-off**: Not suitable for complex client state

### 6. API Style

- **Decision**: REST over GraphQL
- **Rationale**: Simplicity, caching, tooling maturity
- **Trade-off**: Overfetching vs. complexity

## Performance Considerations

### Backend Optimizations

- **Database Indexes**: On foreign keys, slug, email
- **Connection Pooling**: Prisma default (limit: 10)
- **Redis Caching**: Infrastructure ready for high-traffic endpoints
- **Direct S3 Uploads**: Bypass backend for large files

### Frontend Optimizations

- **Code Splitting**: Next.js automatic route-based splitting
- **Image Optimization**: Next.js Image component
- **CDN**: CloudFront for static assets
- **Prefetching**: TanStack Query background fetching

### Future Scalability

- **Pagination**: Not implemented (needed for large datasets)
- **Rate Limiting**: Not implemented (needed for production)
- **Database Sharding**: Not needed yet (vertical scaling sufficient)
- **Microservices**: Monolith sufficient for current scale

## Development Workflow

### Typical Feature Development

1. **Schema Changes**: Edit `packages/database/prisma/schema.prisma`
2. **Generate Client**: Run `pnpm db:generate`
3. **Update Types**: Add DTOs to `packages/types/src/`
4. **Backend Logic**: Implement in appropriate module (`apps/backend/src/`)
5. **Frontend UI**: Create components/pages in `apps/ui-webapp/src/`
6. **API Integration**: Add API client functions + TanStack Query hooks
7. **Testing**: Write tests in `apps/backend/` (frontend tests TBD)
8. **Documentation**: Update relevant docs in `docs/`

### Local Testing Flow

1. Start infrastructure: `docker compose up -d`
2. Generate Prisma client: `pnpm db:generate`
3. Push schema changes: `pnpm db:push` (dev) or `pnpm db:migrate` (prod)
4. Start backend: `pnpm dev:backend` (watch mode)
5. Start frontend: `pnpm dev:ui-webapp` (hot reload)
6. Optional: Prisma Studio: `pnpm db:studio`
7. Optional: Webhook listener: `svix listen http://localhost:3001/user-accounts/clerk-webhook`

## Monitoring & Observability

### Current State

- **Logging**: Console.log (basic)
- **Error Tracking**: Not implemented
- **Metrics**: Not implemented
- **Health Checks**: Redis ping (basic)

### Production Readiness

- **Recommendation**: Add Sentry for error tracking
- **Recommendation**: Add structured logging (Winston, Pino)
- **Recommendation**: Add APM (New Relic, DataDog)
- **Recommendation**: Add uptime monitoring (UptimeRobot, Pingdom)
