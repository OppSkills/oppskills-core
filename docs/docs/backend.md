# Backend Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Modules](#modules)
5. [Authentication & Authorization](#authentication--authorization)
6. [API Documentation](#api-documentation)
7. [Error Handling](#error-handling)
8. [Logging](#logging)
9. [Testing](#testing)
10. [Configuration](#configuration)
11. [Development Guidelines](#development-guidelines)

---

## Overview

The OppSkills backend is a **NestJS-based REST API** that manages hackathons, festivals, teams, and user accounts. It provides a secure, scalable platform with Clerk-based authentication, PostgreSQL database, Redis caching, and AWS S3 media storage.

### Tech Stack

- **Framework**: NestJS 11.x
- **Runtime**: Node.js
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL (via Prisma ORM)
- **Caching**: Redis (ioredis)
- **Authentication**: Clerk
- **Storage**: AWS S3
- **Documentation**: Swagger/OpenAPI
- **Logging**: Winston + New Relic
- **Testing**: Jest

### Key Features

- RESTful API with comprehensive Swagger documentation
- JWT-based authentication via Clerk
- Role-based authorization (ADMIN, USER, VIEWER)
- Webhook integration for user synchronization
- File upload via S3 presigned URLs
- Redis caching layer
- Structured logging with Winston
- Comprehensive validation using class-validator
- CORS configuration for production/development

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Applications                     │
│              (Next.js Frontend, Mobile Apps)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/REST + JWT
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                      NestJS Backend API                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Controllers │  │   Services   │  │    Guards    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     DTOs     │  │ Validators   │  │    Logger    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬──────────────┐
        ▼             ▼             ▼              ▼
    ┌────────┐   ┌────────┐   ┌────────┐    ┌────────┐
    │ Prisma │   │ Redis  │   │ Clerk  │    │  S3    │
    │   DB   │   │ Cache  │   │  Auth  │    │Storage │
    └────────┘   └────────┘   └────────┘    └────────┘
        │
        ▼
   PostgreSQL
```

### Data Flow

1. **Request** → Client sends HTTP request with JWT token
2. **Authentication** → `ClerkAuthGuard` validates token and extracts user
3. **Authorization** → `AdminGuard` (if needed) checks user access level
4. **Validation** → DTOs validate request body using `class-validator`
5. **Business Logic** → Service layer processes request
6. **Data Access** → Prisma ORM interacts with PostgreSQL
7. **Caching** → Redis stores frequently accessed data
8. **Response** → Structured JSON response sent to client

---

## Project Structure

```
apps/backend/
├── src/
│   ├── _utils/                 # Utility classes
│   │   └── logger.ts           # Winston logger with NewRelic integration
│   ├── common/                 # Shared module (guards, config, cache)
│   │   ├── common.module.ts
│   │   ├── config.service.ts   # Environment configuration
│   │   ├── cache.service.ts    # Redis cache service
│   │   ├── clerk-auth.guard.ts # JWT authentication guard
│   │   └── admin.guard.ts      # Admin authorization guard
│   ├── user-accounts/          # User management & Clerk webhooks
│   │   ├── user-accounts.module.ts
│   │   ├── user-accounts.controller.ts
│   │   └── user-accounts.service.ts
│   ├── hackathon/              # Hackathon management
│   │   ├── hackathon.module.ts
│   │   ├── hackathon.controller.ts
│   │   ├── hackathon.service.ts
│   │   └── hackathon-update-nested.dto.ts
│   ├── festival/               # Festival management
│   │   ├── festival.module.ts
│   │   ├── festival.controller.ts
│   │   └── festival.service.ts
│   ├── team/                   # Team management
│   │   ├── team.module.ts
│   │   ├── team.controller.ts
│   │   └── team.service.ts
│   ├── media/                  # S3 file upload
│   │   ├── media.module.ts
│   │   ├── media.controller.ts
│   │   ├── media.service.ts
│   │   └── media.dto.ts
│   ├── app.module.ts           # Root application module
│   ├── app.controller.ts       # Health check endpoint
│   ├── app.service.ts
│   └── main.ts                 # Application bootstrap
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env.local                  # Local environment variables
```

---

## Modules

### 1. CommonModule (Global)

**Purpose**: Provides shared services and guards accessible throughout the application.

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/common/`

**Exports**:
- `ClerkAuthConfigService` - Environment configuration
- `CacheService` - Redis caching
- `AdminGuard` - Admin authorization

#### ClerkAuthConfigService

Centralizes all environment configuration.

```typescript
@Injectable()
export class ClerkAuthConfigService {
  get clerkWebhookSecret(): string;
  get clerkSecretKey(): string;
  get redisHost(): string;
  get redisPort(): number;
  get redisPassword(): string;
  get adminUserIds(): string[];  // Comma-separated Clerk user IDs
}
```

**Key Configuration**:
- Clerk authentication keys
- Redis connection details
- Admin user ID list

#### CacheService

Redis-based caching with automatic connection health monitoring.

```typescript
@Injectable()
export class CacheService {
  async set(key: string, value: any, ttl?: number): Promise<void>;
  async get(key: string): Promise<string | null>;
  async delete(key: string): Promise<void>;
  async keys(pattern: string): Promise<string[]>;
  async setJSON(key: string, value: any, ttl?: number): Promise<void>;
  async getJSON(key: string): Promise<any | null>;
}
```

**Features**:
- Automatic reconnection on connection failure
- Health check via periodic ping
- Graceful degradation (logs warnings instead of crashing)
- JSON serialization/deserialization helpers

**Note**: Redis initialization is currently commented out in `onModuleInit()`. Cache methods safely handle unhealthy connections.

---

### 2. UserAccountsModule

**Purpose**: Manages user accounts and synchronizes with Clerk via webhooks.

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/user-accounts/`

#### UserAccountsController

**Base Path**: `/user-accounts`

##### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/clerk-webhook` | None | Clerk webhook for user sync |
| GET | `/search?q={query}` | Required | Search users by email |

##### POST /clerk-webhook

Handles Clerk webhook events for user synchronization.

**Headers**:
- `svix-id` - Webhook message ID
- `svix-timestamp` - Webhook timestamp
- `svix-signature` - HMAC signature for verification

**Request Body**: `ClerkWebhookRequestDto`

**Supported Events**:
- `user.created` - Creates new user in database
- `user.updated` - Updates existing user
- `user.deleted` - Deletes user from database

**Example**:
```bash
curl -X POST http://localhost:3001/user-accounts/clerk-webhook \
  -H "Content-Type: application/json" \
  -H "svix-id: msg_..." \
  -H "svix-timestamp: 1234567890" \
  -H "svix-signature: v1,..." \
  -d '{
    "type": "user.created",
    "data": {
      "id": "user_abc123",
      "email_addresses": [{"email_address": "user@example.com", "verification": {"status": "verified"}}],
      "first_name": "John",
      "last_name": "Doe",
      "image_url": "https://..."
    }
  }'
```

**Security**:
- Verifies webhook signature using HMAC SHA-256
- Rejects requests with invalid signatures (401 Unauthorized)

##### GET /search

Search users by email for autocomplete/role assignment.

**Query Parameters**:
- `q` (required) - Search query (partial email, case-insensitive)

**Response**: Array of matching users (max 10 results)

**Example**:
```bash
curl -X GET "http://localhost:3001/user-accounts/search?q=john" \
  -H "Authorization: Bearer <jwt-token>"
```

#### UserAccountsService

**Key Methods**:

```typescript
async create(data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}): Promise<UserEntity>;

async update(data: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl: string;
}): Promise<UserEntity>;

async delete({ user_id }: { user_id: string }): Promise<{ success: boolean; data: { user_id: string } }>;

async searchUsers(query: string): Promise<UserEntity[]>;

private async verifyWebhookSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string
): Promise<boolean>;
```

**Business Logic**:
- Ensures verified email before creating/updating users
- Uses timing-safe comparison for signature verification
- Returns up to 10 search results ordered by email

---

### 3. HackathonModule

**Purpose**: Comprehensive hackathon management including CRUD, rounds, prizes, registration, and role-based access control.

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/hackathon/`

#### HackathonController

**Base Path**: `/hackathons`

**All endpoints require authentication** via `ClerkAuthGuard`.

##### Core CRUD Endpoints

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| POST | `/` | Create hackathon (DRAFT) | Authenticated users |
| GET | `/` | List all hackathons | All authenticated |
| GET | `/my` | List my hackathons (owner/manager) | Authenticated users |
| GET | `/:id` | Get hackathon by ID | All authenticated |
| GET | `/by-slug/:slug` | Get hackathon by slug | All authenticated |
| PUT | `/:id` | Update hackathon | Owner only |
| DELETE | `/:id` | Delete hackathon | Owner only |
| PATCH | `/:id/status` | Update lifecycle status | Owner only |

##### Nested Resource Endpoints

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| PUT | `/:id/rounds` | Replace all rounds | Owner only (DRAFT) |
| PUT | `/:id/additional-info` | Update contact/attachments | Owner only (DRAFT) |
| PUT | `/:id/registration-form` | Replace registration form | Owner only (DRAFT) |
| PUT | `/:id/prize-breakdown` | Replace prize breakdown | Owner only (DRAFT) |
| PUT | `/:id/max-teams` | Update max teams limit | Owner only (DRAFT) |

##### Registration & Role Management

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| POST | `/:id/register` | Register for hackathon | Authenticated users |
| GET | `/:id/roles` | Get all roles (owner/managers/evaluators) | All authenticated |
| POST | `/:id/roles` | Add manager/evaluator | Owner/Admin only |
| DELETE | `/:id/roles` | Remove manager/evaluator | Owner/Admin only |

##### Example: Create Hackathon

```bash
curl -X POST http://localhost:3001/hackathons \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Innovation Hackathon 2025",
    "description": "48-hour coding challenge",
    "mode": "HYBRID",
    "startDate": "2025-03-15T09:00:00Z",
    "endDate": "2025-03-17T18:00:00Z",
    "location": {
      "type": "PHYSICAL",
      "address": "123 Tech Street",
      "city": "San Francisco"
    },
    "visibility": "PUBLIC",
    "hackathonType": "CODING_HACKATHON",
    "participantType": "TEAM",
    "isFree": true,
    "attendeeEligibility": ["EVERYONE_CAN_APPLY"],
    "maxTeams": 50
  }'
```

**Response**:
```json
{
  "message": "Hackathon created successfully (DRAFT).",
  "data": {
    "id": "uuid-here",
    "name": "Tech Innovation Hackathon 2025",
    "slug": "tech-innovation-hackathon-2025",
    "status": "DRAFT",
    "organizerId": "user_abc123",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

##### Example: Add Manager Role

```bash
curl -X POST http://localhost:3001/hackathons/{hackathonId}/roles \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@example.com",
    "role": "MANAGER"
  }'
```

#### HackathonService

**Key Business Logic**:

1. **Lifecycle Status Management**:
   - All hackathons created as `DRAFT`
   - Nested updates (rounds, prizes, etc.) only allowed in `DRAFT`
   - Status transitions: DRAFT → PUBLISHED → ONGOING → COMPLETED
   - CANCELLED status available at any time

2. **Default Rounds Generation**:
   - If no rounds provided, generates 3 default rounds
   - Evenly splits hackathon timeline across rounds
   - Each round named: "Round 1", "Round 2", "Round 3"

3. **Slug Generation**:
   - Auto-generates URL-friendly slugs from hackathon name
   - Ensures uniqueness by appending counter if needed
   - Example: "Tech Fest" → "tech-fest" or "tech-fest-2"

4. **Validation**:
   - Location validation (physical requires address/city, virtual requires link)
   - University restriction validation (only applies to UNIVERSITY_ONLY visibility)
   - Pricing validation (free hackathons cannot have entry fees)
   - Date validation (endDate >= startDate)

5. **Role-Based Access**:
   - **Owner**: Full control (create, update, delete, manage roles)
   - **Manager**: Can view and manage hackathon (shown in dashboard)
   - **Evaluator**: Read-only future feature (not yet implemented)

**Key Methods**:

```typescript
async createHackathon(dto: CreateHackathonDto, userId: string): Promise<HackathonEntity>;
async listHackathons({ festivalId?: string }): Promise<HackathonEntity[]>;
async listMyHackathons(userId: string): Promise<HackathonEntity[]>;
async getHackathonById(id: string): Promise<HackathonEntity>;
async getHackathonBySlug(slug: string): Promise<HackathonEntity>;
async updateHackathon(id: string, dto: UpdateHackathonDto, userId: string): Promise<HackathonEntity>;
async deleteHackathon(id: string, userId: string): Promise<{ message: string }>;
async updateHackathonStatus(id: string, status: LifecycleStatus, userId: string): Promise<HackathonEntity>;
async registerForHackathon(hackathonId: string, userId: string): Promise<{ message: string; registrationId: string }>;
async updateHackathonRounds(id: string, dto: UpdateHackathonRoundsDto, userId: string): Promise<HackathonEntity>;
async updateHackathonAdditionalInfo(id: string, dto: UpdateHackathonAdditionalInfoDto, userId: string): Promise<HackathonEntity>;
async updateHackathonRegistrationForm(id: string, form: RegistrationFormDto, userId: string): Promise<HackathonEntity>;
async updateHackathonPrizeBreakdown(id: string, dto: UpdateHackathonPrizeBreakdownDto, userId: string): Promise<HackathonEntity>;
async updateHackathonMaxTeams(id: string, maxTeams: number | null, userId: string): Promise<HackathonEntity>;
async getHackathonRoles(id: string): Promise<{ owner: UserEntity; managers: RoleEntity[]; evaluators: RoleEntity[] }>;
async addHackathonRole(id: string, email: string, role: 'MANAGER' | 'EVALUATOR', userId: string): Promise<{ message: string; alreadyExists: boolean }>;
async removeHackathonRole(id: string, email: string, role: 'MANAGER' | 'EVALUATOR', userId: string): Promise<{ message: string }>;
```

---

### 4. FestivalModule

**Purpose**: Manage festival events that can contain multiple hackathons.

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/festival/`

#### FestivalController

**Base Path**: `/festivals`

**All endpoints require authentication**.

##### Endpoints

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| POST | `/` | Create festival | Authenticated users |
| GET | `/` | List all festivals | All authenticated |
| GET | `/:id` | Get festival by ID | All authenticated |
| PUT | `/:id` | Update festival | Owner only |
| DELETE | `/:id` | Delete festival | Owner only |
| PATCH | `/:id/status` | Update lifecycle status | Owner only |
| GET | `/:id/hackathons` | Get all hackathons in festival | All authenticated |

##### Example: Create Festival

```bash
curl -X POST http://localhost:3001/festivals \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "TechFest 2025",
    "description": "Annual technology festival",
    "startDate": "2025-04-01T09:00:00Z",
    "endDate": "2025-04-03T18:00:00Z",
    "location": {
      "type": "PHYSICAL",
      "address": "Convention Center",
      "city": "New York"
    },
    "organizationName": "Tech University",
    "websiteUrl": "https://techfest2025.example.com"
  }'
```

#### FestivalService

**Key Features**:
- Similar lifecycle management to hackathons (DRAFT → PUBLISHED → ONGOING → COMPLETED)
- Owner-only access control
- Slug generation from festival name
- Cascading relationship with hackathons

**Key Methods**:

```typescript
async createFestival(dto: CreateFestivalDto, userId: string): Promise<FestivalEntity>;
async listFestivals(): Promise<FestivalEntity[]>;
async getFestivalById(id: string): Promise<FestivalEntity>;
async updateFestival(id: string, dto: UpdateFestivalDto, userId: string): Promise<FestivalEntity>;
async deleteFestival(id: string, userId: string): Promise<{ message: string }>;
async updateFestivalStatus(id: string, status: LifecycleStatus, userId: string): Promise<FestivalEntity>;
async getHackathonsUnderFestival(id: string): Promise<HackathonEntity[]>;
```

---

### 5. TeamModule

**Purpose**: Manage team creation, joining, and membership for hackathons.

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/team/`

#### TeamController

**Base Path**: `/hackathons` (Note: Teams are scoped under hackathons)

**All endpoints require authentication**.

##### Endpoints

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| POST | `/create-team` | Create new team | Authenticated users |
| GET | `/teams/:hackathonId` | List teams by hackathon | All authenticated |
| GET | `/team/:teamId` | Get team details | All authenticated |
| POST | `/join-team` | Join existing team | Authenticated users |
| DELETE | `/leave-team/:teamId` | Leave a team | Team members |

##### Example: Create Team

```bash
curl -X POST http://localhost:3001/hackathons/create-team \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Code Warriors",
    "hackathonId": "hackathon-uuid",
    "maxSize": 4
  }'
```

**Response**:
```json
{
  "id": "team-uuid",
  "name": "Code Warriors",
  "hackathonId": "hackathon-uuid",
  "leaderId": "user_abc123",
  "maxSize": 4,
  "invitationCode": "ABC123XYZ",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

##### Example: Join Team

```bash
curl -X POST http://localhost:3001/hackathons/join-team \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "teamId": "team-uuid",
    "invitationCode": "ABC123XYZ"
  }'
```

#### TeamService

**Key Features**:
- Automatic invitation code generation
- Team size limits enforcement
- Leader cannot leave team (must disband)
- Prevents duplicate team membership

**Key Methods**:

```typescript
async createTeam(dto: CreateTeamDto, userId: string): Promise<TeamEntity>;
async getTeamsByHackathon(hackathonId: string): Promise<TeamEntity[]>;
async getTeamById(teamId: string): Promise<TeamEntity>;
async joinTeam(dto: CreateTeamDto, userId: string): Promise<{ message: string; teamId: string; memberId: string }>;
async leaveTeam(teamId: string, userId: string): Promise<{ message: string }>;
```

---

### 6. MediaModule

**Purpose**: Generate presigned URLs for direct S3 uploads (images and documents).

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/media/`

#### MediaController

**Base Path**: `/media`

**All endpoints require authentication**.

##### Endpoints

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| POST | `/presign-image` | Generate presigned POST for image upload | Authenticated users |
| POST | `/presign-document` | Generate presigned POST for document upload | Authenticated users |

##### POST /presign-image

Generate a presigned POST policy for uploading images directly to S3.

**Request Body**: `PresignImageUploadDto`
```json
{
  "purpose": "HACKATHON_BANNER",
  "mimeType": "image/png"
}
```

**Purpose Values**:
- `HACKATHON_BANNER` - Hackathon banner images
- `EVENT_ATTACHMENT` - Event-related images
- `OPPORTUNITY_ATTACHMENT` - Opportunity images

**Supported MIME Types**:
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

**Response**:
```json
{
  "uploadUrl": "https://oppskills-media.s3.amazonaws.com",
  "fields": {
    "key": "hackathons/2025/banner-abc123.png",
    "Content-Type": "image/png",
    "policy": "base64-encoded-policy",
    "x-amz-signature": "signature-here"
  },
  "key": "hackathons/2025/banner-abc123.png",
  "publicUrl": "https://cdn.oppskills.com/hackathons/2025/banner-abc123.png",
  "maxBytes": 5242880
}
```

**Client Upload Flow**:
1. Request presigned URL from backend
2. Upload file directly to S3 using `uploadUrl` and `fields`
3. Store `publicUrl` in hackathon/event record

**Example with fetch**:
```javascript
// 1. Get presigned URL
const response = await fetch('http://localhost:3001/media/presign-image', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <jwt>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    purpose: 'HACKATHON_BANNER',
    mimeType: 'image/png'
  })
});
const { uploadUrl, fields, publicUrl } = await response.json();

// 2. Upload to S3
const formData = new FormData();
Object.entries(fields).forEach(([key, value]) => {
  formData.append(key, value);
});
formData.append('file', imageFile);

await fetch(uploadUrl, {
  method: 'POST',
  body: formData
});

// 3. Save publicUrl to backend
await updateHackathon({ bannerImageUrl: publicUrl });
```

##### POST /presign-document

Generate presigned POST for document uploads (PDF, DOC, XLS, PPT).

**Request Body**: `PresignDocumentUploadDto`
```json
{
  "purpose": "EVENT_ATTACHMENT",
  "mimeType": "application/pdf",
  "fileName": "event-rules.pdf"
}
```

**Supported MIME Types**:
- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.ms-excel`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/vnd.ms-powerpoint`
- `application/vnd.openxmlformats-officedocument.presentationml.presentation`

**Max Size**: 10MB (10485760 bytes)

#### MediaService

**Key Features**:
- MIME type validation
- File size limits (5MB for images, 10MB for documents)
- UUID-based unique filenames
- Purpose-based S3 key prefixes
- Presigned POST (client-side upload, no backend file handling)

**Key Methods**:

```typescript
async presignImageUpload(params: {
  userId: string;
  purpose: MediaUploadPurposeValue;
  mimeType: string;
}): Promise<PresignImageUploadResponse>;

async presignDocumentUpload(params: {
  userId: string;
  purpose: string;
  mimeType: string;
  fileName: string;
}): Promise<PresignDocumentUploadResponse>;
```

---

## Authentication & Authorization

### Authentication Flow

The backend uses **Clerk** for authentication via JWT tokens.

#### ClerkAuthGuard

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/common/clerk-auth.guard.ts`

**Purpose**: Validates JWT tokens and attaches user info to request.

**Token Extraction**:
1. **Authorization Header**: `Bearer <token>`
2. **Query Parameter**: `?token=<token>` (fallback)

**Verification Process**:
```typescript
const sessionClaims = await verifyToken(token, {
  secretKey: this.configService.clerkSecretKey,
  clockSkewInMs: 15000  // Allow 15s clock drift
});

const userId = sessionClaims.sub;  // Extract user ID from JWT
const email = sessionClaims.email; // Extract email

request.user = { id: userId, email };
```

**Error Handling**:
- Missing token → `401 Unauthorized`
- Invalid token → `401 Unauthorized`
- Expired token → `401 Unauthorized`

#### Development Auth Bypass

For local development/testing without Clerk:

**Environment Variable**: `AUTH_BYPASS=true`

**Headers**:
- `x-user-id` - User ID
- `x-user-email` - User email (optional, defaults to `{userId}@local.test`)

**Security**:
- Only works in `development` or `test` environments
- Automatically rejected in production (logs security warning)
- Auto-creates user in database if doesn't exist

**Example**:
```bash
curl -X GET http://localhost:3001/hackathons \
  -H "x-user-id: test-user-123" \
  -H "x-user-email: test@example.com"
```

### Authorization Flow

#### Access Levels

Defined in database schema (`UserEntity.accessLevel`):

- **ADMIN** - Full system access (can manage any resource)
- **USER** - Standard user (default, can create/manage own resources)
- **VIEWER** - Read-only access (future feature)

#### AdminGuard

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/common/admin.guard.ts`

**Purpose**: Restricts endpoints to users with `ADMIN` access level.

**Implementation**:
```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.id;

    // Query database for access level (uses raw SQL for stability)
    const rows = await prisma.$queryRaw<Array<{ access_level: AccessLevelValue }>>`
      SELECT "access_level"
      FROM "oppskills"."user"
      WHERE "id" = ${userId}
      LIMIT 1
    `;

    if (rows[0]?.access_level !== 'ADMIN') {
      throw new ForbiddenException('Admin access required.');
    }

    return true;
  }
}
```

**Usage**:
```typescript
@Post('admin-only-endpoint')
@UseGuards(ClerkAuthGuard, AdminGuard)
async adminAction() {
  // Only accessible to ADMIN users
}
```

**Admin User Configuration**:

Set admin user IDs in environment:
```bash
ADMIN_USER_IDS=user_abc123,user_def456,user_ghi789
```

**Note**: Currently, the `AdminGuard` checks the database `access_level` field. Ensure admin users have `accessLevel = 'ADMIN'` in the database.

### Owner-Based Authorization

Most resources (hackathons, festivals, teams) use **owner-based authorization**:

**Pattern**:
```typescript
async updateHackathon(id: string, dto: UpdateHackathonDto, userId: string) {
  const hackathon = await prisma.hackathonEntity.findUnique({
    where: { id },
    select: { ownerId: true }
  });

  if (!hackathon) {
    throw new NotFoundException('Hackathon not found');
  }

  if (hackathon.ownerId !== userId) {
    throw new ForbiddenException('Only the owner can update this hackathon');
  }

  // Proceed with update...
}
```

**Access Rules**:
- **Owner**: Full CRUD access
- **Manager** (hackathons only): Can view and manage, shown in dashboard
- **Other users**: Read-only access (public resources only)

---

## API Documentation

### Swagger/OpenAPI

The backend provides **interactive API documentation** via Swagger UI.

**Access**: `http://localhost:3001/api-reference`

**Configuration** (in `main.ts`):
```typescript
const config = new DocumentBuilder()
  .setTitle('OppSkills API')
  .setDescription('OppSkills API Documentation - Manage hackathons, festivals, and teams')
  .setVersion('1.0')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Enter your Clerk JWT token',
    },
    'clerk-auth',
  )
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-reference', app, document);
```

### API Decorators

Controllers use Swagger decorators for documentation:

```typescript
@ApiTags('Hackathons')
@ApiBearerAuth('clerk-auth')
@Controller('hackathons')
export class HackathonController {

  @Post()
  @ApiOperation({ summary: 'Create a new hackathon' })
  @ApiBody({ type: CreateHackathonDto })
  @ApiResponse({ status: 201, description: 'Hackathon created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createHackathon(@Body() dto: CreateHackathonDto) {
    // ...
  }
}
```

### CORS Configuration

**Allowed Origins**:

**Production**:
- `https://oppskills.com`
- `https://www.oppskills.com`
- `https://app.oppskills.com`

**Development** (includes production origins + localhost):
- `http://localhost:3000`
- `http://127.0.0.1:3000`

**Allowed Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS

**Credentials**: Enabled

---

## Error Handling

### Standard HTTP Exceptions

NestJS provides built-in HTTP exceptions used throughout the backend:

```typescript
import {
  BadRequestException,      // 400
  UnauthorizedException,     // 401
  ForbiddenException,        // 403
  NotFoundException,         // 404
  ConflictException,         // 409
  InternalServerErrorException, // 500
} from '@nestjs/common';
```

### Error Response Format

All errors follow NestJS standard format:

```json
{
  "statusCode": 400,
  "message": "endDate must be >= startDate.",
  "error": "Bad Request"
}
```

### Validation Errors

Using `class-validator` with `ValidationPipe`:

**Configuration** (in `main.ts`):
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip unknown fields
    forbidNonWhitelisted: true,   // Reject unknown fields
    transform: true,              // Enable DTO transformation
    transformOptions: {
      enableImplicitConversion: false,
    },
  }),
);
```

**Validation Error Response**:
```json
{
  "statusCode": 400,
  "message": [
    "name should not be empty",
    "startDate must be a valid ISO 8601 date string",
    "mode must be one of the following values: ONLINE, OFFLINE, HYBRID"
  ],
  "error": "Bad Request"
}
```

### Common Error Patterns

#### 1. Resource Not Found

```typescript
const hackathon = await prisma.hackathonEntity.findUnique({
  where: { id }
});

if (!hackathon) {
  throw new NotFoundException('Hackathon not found');
}
```

#### 2. Authorization Check

```typescript
if (hackathon.ownerId !== userId) {
  throw new ForbiddenException('Only the owner can update this hackathon');
}
```

#### 3. Business Logic Validation

```typescript
if (endDate.getTime() < startDate.getTime()) {
  throw new BadRequestException('endDate must be >= startDate.');
}
```

#### 4. Database Constraint Violations

```typescript
try {
  await prisma.hackathonEntity.create({ data });
} catch (error) {
  if (error.code === 'P2002') {  // Unique constraint violation
    throw new ConflictException('A hackathon with this slug already exists');
  }
  throw new InternalServerErrorException('Database error');
}
```

### Webhook Signature Verification

Clerk webhooks verify signatures to prevent spoofing:

```typescript
private async verifyWebhookSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
): Promise<boolean> {
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const secretBytes = Buffer.from(
    clerkWebhookSecret.split('_')[1],
    'base64',
  );

  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(actualSignature),
  );
}
```

**Invalid Signature** → `401 Unauthorized`

---

## Logging

### Logger Implementation

**Location**: `/Users/harshit/Documents/freelance/oppskills-core/apps/backend/src/_utils/logger.ts`

The backend uses a **custom Winston-based logger** with New Relic integration.

### Features

- **Structured JSON Logging**: All logs in JSON format
- **Context Propagation**: Request context via AsyncLocalStorage
- **Log Levels**: debug, info, warn, error, verbose
- **Environment-Aware**: Different verbosity for dev/prod
- **New Relic Integration**: Automatic log forwarding in production
- **Error Stack Traces**: Automatic stack trace capture
- **Message Truncation**: Limits messages to 10,000 chars

### Usage

```typescript
import { Logger } from 'src/_utils/logger';

export class MyService {
  private readonly logger = new Logger(MyService.name);

  async doSomething() {
    this.logger.log('Starting operation');
    this.logger.debug('Debug details:', { foo: 'bar' });
    this.logger.warn('Warning message');
    this.logger.error('Error occurred:', error);
  }
}
```

### Log Output Format

**Development**:
```json
{
  "ts": "2025-01-15 10:30:45.123",
  "lvl": "info",
  "svc": "HackathonService",
  "msg": "Creating hackathon by userId=user_abc123",
  "uid": "user_abc123",
  "env": "development"
}
```

**Production**: Same format + file logging to `logs/error.log`

### Context Propagation

Set context for all logs within a request:

```typescript
Logger.setContext({
  userId: 'user_abc123',
  correlationId: 'req-xyz',
  operation: 'createHackathon'
});

// All subsequent logs automatically include this context
this.logger.info('Hackathon created');
// Output: { ..., uid: 'user_abc123', correlationId: 'req-xyz', ... }
```

### Log Level Filtering

Control verbosity per service in development:

```typescript
const logLevelMap: { [key: string]: string } = {
  WorkerService: 'error',  // Only log errors
  CacheService: 'error',   // Only log errors
};
```

### New Relic Integration

In production, logs are automatically forwarded to New Relic:

```typescript
private logToWinstonAndNewRelic(level: string, args: ReadonlyArray<unknown>) {
  // Log to Winston (console/file)
  this.logger.log(level, message, metadata);

  // Log to New Relic (production only)
  if (process.env.NODE_ENV === 'production') {
    const nr = loadNewRelic();
    if (nr) {
      nr.recordLogEvent({
        message: `[${this.prefix}] ${message}`,
        level,
        timestamp: Date.now(),
        ...context,
      });
    }
  }
}
```

**Lazy Loading**: New Relic is only loaded in production to avoid test side-effects.

---

## Testing

### Testing Framework

- **Test Runner**: Jest 30.x
- **Test Types**: Unit tests, E2E tests
- **Coverage**: Jest coverage reports

### Test Structure

```
apps/backend/
├── src/
│   └── **/*.spec.ts       # Unit tests (co-located with source)
└── test/
    ├── app.e2e-spec.ts    # End-to-end tests
    └── jest-e2e.json      # E2E Jest config
```

### Running Tests

```bash
# Navigate to backend directory
cd apps/backend

# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:cov

# Run E2E tests
pnpm test:e2e

# Debug tests
pnpm test:debug
```

### Jest Configuration

**Unit Tests** (`package.json`):
```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "moduleNameMapper": {
      "^src/(.*)$": "<rootDir>/$1"
    },
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

**E2E Tests** (`test/jest-e2e.json`):
```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  }
}
```

### Test Best Practices

1. **Co-locate unit tests** with source files (`*.spec.ts`)
2. **Mock external dependencies** (Prisma, Redis, Clerk)
3. **Use test fixtures** for consistent test data
4. **Test error cases** alongside happy paths
5. **Avoid New Relic side effects** in tests (logger handles this)

### Example E2E Test

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
```

---

## Configuration

### Environment Variables

**File**: `.env.local` (development) or `.env` (production)

#### Core Configuration

```bash
# Server
PORT=3001
NODE_ENV=development  # or 'production'

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/oppskills?schema=oppskills

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Redis Cache
REDISHOST=localhost
REDISPORT=6379
REDISPASSWORD=

# Admin Access
ADMIN_USER_IDS=user_abc123,user_def456

# Development Only
AUTH_BYPASS=true  # Enable auth bypass (NEVER in production)
```

#### AWS S3 (Media Upload)

```bash
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=oppskills-media
CDN_BASE_URL=https://cdn.oppskills.com
```

### Configuration Service

**ClerkAuthConfigService** provides type-safe access to environment variables:

```typescript
@Injectable()
export class ClerkAuthConfigService {
  constructor(private readonly configService: ConfigService) {}

  get clerkWebhookSecret(): string {
    return this.configService.get('CLERK_WEBHOOK_SECRET');
  }

  get clerkSecretKey(): string {
    return this.configService.get('CLERK_SECRET_KEY') || '';
  }

  get redisHost(): string {
    return this.configService.get('REDISHOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get('REDISPORT', 6379);
  }

  get adminUserIds(): string[] {
    const raw = this.configService.get<string>('ADMIN_USER_IDS', '');
    return raw.split(',').map(v => v.trim()).filter(v => v.length > 0);
  }
}
```

### Production Secrets Management

Production secrets are loaded from **AWS Secrets Manager**:

**File**: `load-secrets.mts` (in project root)

**Behavior**:
- Only runs when `NODE_ENV !== 'local'`
- Uses IAM role credentials from container metadata
- Loads secrets into environment variables before app starts

**Usage**:
```bash
# Start command in production
node load-secrets.mjs && node dist/main.js
```

---

## Development Guidelines

### Code Style

- **Language**: TypeScript with strict type checking
- **Linting**: ESLint with Prettier integration
- **Formatting**: Prettier (2 spaces, single quotes)

### Linting & Formatting

```bash
# Lint backend code
cd apps/backend
pnpm lint

# Format backend code
pnpm format

# Type check
pnpm check-types
```

### Module Structure

Follow NestJS module pattern:

```
module-name/
├── module-name.module.ts      # Module definition
├── module-name.controller.ts  # HTTP endpoints
├── module-name.service.ts     # Business logic
└── module-name.dto.ts         # Data Transfer Objects (if not shared)
```

### DTO Best Practices

1. **Use class-validator** for validation:
   ```typescript
   import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

   export class CreateHackathonDto {
     @IsString()
     @IsNotEmpty()
     name: string;

     @IsString()
     @IsOptional()
     description?: string;
   }
   ```

2. **Leverage Swagger decorators**:
   ```typescript
   import { ApiProperty } from '@nestjs/swagger';

   export class CreateHackathonDto {
     @ApiProperty({ description: 'Hackathon name', example: 'Tech Fest 2025' })
     @IsString()
     @IsNotEmpty()
     name: string;
   }
   ```

3. **Share DTOs via @oppskills/types** package for frontend/backend consistency

### Service Best Practices

1. **Inject dependencies** via constructor:
   ```typescript
   @Injectable()
   export class HackathonService {
     constructor(
       private readonly configService: ClerkAuthConfigService,
       private readonly cacheService: CacheService,
     ) {}
   }
   ```

2. **Use Prisma client** from @oppskills/db:
   ```typescript
   import { prisma } from '@oppskills/db';

   const hackathon = await prisma.hackathonEntity.findUnique({ where: { id } });
   ```

3. **Throw descriptive exceptions**:
   ```typescript
   if (!hackathon) {
     throw new NotFoundException(`Hackathon with ID ${id} not found`);
   }
   ```

4. **Log important operations**:
   ```typescript
   this.logger.log(`Creating hackathon by userId=${userId}`);
   ```

### Controller Best Practices

1. **Use guards for authentication**:
   ```typescript
   @UseGuards(ClerkAuthGuard)
   @Controller('hackathons')
   export class HackathonController {}
   ```

2. **Extract user from request**:
   ```typescript
   async createHackathon(@Req() req: Request) {
     const userId = req.user?.id;
     if (!userId) throw new UnauthorizedException('User not found');
   }
   ```

3. **Document all endpoints**:
   ```typescript
   @Post()
   @ApiOperation({ summary: 'Create a new hackathon' })
   @ApiResponse({ status: 201, description: 'Created' })
   @ApiResponse({ status: 401, description: 'Unauthorized' })
   async createHackathon() {}
   ```

### Database Access

1. **Use Prisma Client** (never raw SQL unless necessary):
   ```typescript
   const hackathons = await prisma.hackathonEntity.findMany({
     where: { ownerId: userId },
     include: { rounds: true, prizeBreakdown: true }
   });
   ```

2. **Handle unique constraints**:
   ```typescript
   try {
     await prisma.hackathonEntity.create({ data });
   } catch (error) {
     if (error.code === 'P2002') {
       throw new ConflictException('Duplicate entry');
     }
     throw error;
   }
   ```

3. **Use transactions** for multi-step operations:
   ```typescript
   await prisma.$transaction(async (tx) => {
     const hackathon = await tx.hackathonEntity.create({ data });
     await tx.roundEntity.createMany({ data: rounds });
   });
   ```

### Error Handling

1. **Use specific HTTP exceptions**
2. **Provide helpful error messages**
3. **Log errors before throwing**:
   ```typescript
   try {
     // operation
   } catch (error) {
     this.logger.error('Operation failed:', error);
     throw new InternalServerErrorException('Operation failed');
   }
   ```

### Security Guidelines

1. **Always validate user input** with DTOs
2. **Verify ownership** before mutations:
   ```typescript
   if (hackathon.ownerId !== userId) {
     throw new ForbiddenException('Not authorized');
   }
   ```
3. **Never expose sensitive data** in responses
4. **Use HTTPS** in production
5. **Verify webhook signatures** for external integrations
6. **Never commit secrets** to git

### Performance Guidelines

1. **Use database indexes** for frequently queried fields
2. **Select only needed fields**:
   ```typescript
   await prisma.hackathonEntity.findMany({
     select: { id: true, name: true, slug: true }
   });
   ```
3. **Use Redis caching** for expensive queries (when enabled)
4. **Avoid N+1 queries** with Prisma include/select
5. **Paginate large result sets**

---

## Quick Reference

### Common Commands

```bash
# Development
pnpm dev:backend              # Start backend in watch mode
pnpm build:backend            # Build backend

# Database
pnpm db:generate              # Generate Prisma client
pnpm db:push                  # Push schema (dev only)
pnpm db:migrate               # Create migration
pnpm db:studio                # Open Prisma Studio

# Testing
cd apps/backend && pnpm test  # Run unit tests
cd apps/backend && pnpm test:e2e  # Run E2E tests

# Code Quality
pnpm lint                     # Lint all code
pnpm format                   # Format all code
```

### API Endpoints Summary

| Module | Base Path | Auth Required | Key Endpoints |
|--------|-----------|---------------|---------------|
| App | `/` | No | `GET /` (health check) |
| User Accounts | `/user-accounts` | Partial | `POST /clerk-webhook`, `GET /search` |
| Hackathons | `/hackathons` | Yes | `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| Festivals | `/festivals` | Yes | `POST /`, `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id` |
| Teams | `/hackathons` | Yes | `POST /create-team`, `POST /join-team`, `DELETE /leave-team/:id` |
| Media | `/media` | Yes | `POST /presign-image`, `POST /presign-document` |

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Missing/invalid JWT token |
| 403 | Forbidden | Not owner/admin, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate entry, constraint violation |
| 500 | Internal Server Error | Unexpected server error |

---

## Appendix

### Dependencies

**Core**:
- `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express` - NestJS framework
- `@nestjs/config` - Configuration management
- `@nestjs/swagger` - API documentation
- `@oppskills/db` - Prisma client (workspace package)
- `@oppskills/types` - Shared types/DTOs (workspace package)

**Authentication**:
- `@clerk/backend` - Clerk JWT verification

**Database & Caching**:
- `ioredis` - Redis client

**Validation**:
- `class-validator` - DTO validation
- `class-transformer` - DTO transformation

**Storage**:
- `@aws-sdk/client-s3` - S3 operations
- `@aws-sdk/s3-presigned-post` - Presigned POST URLs

**Logging**:
- `winston` - Logging framework
- `nest-winston` - NestJS Winston integration
- `newrelic` - Application monitoring

**Webhooks**:
- `svix` - Webhook signature verification
- `crypto` - HMAC signature verification

### File Upload Architecture

**Why Presigned URLs?**

Instead of uploading files through the backend, we use **presigned POST** URLs:

1. **Client requests presigned URL** from backend
2. **Backend generates presigned POST** with AWS credentials
3. **Client uploads directly to S3** using presigned URL
4. **Client stores public URL** in database via backend

**Benefits**:
- Reduces backend load (no file buffering)
- Faster uploads (direct to S3)
- Better scalability
- Automatic CDN distribution

**Security**:
- Presigned URLs expire after 5 minutes
- MIME type enforcement
- File size limits (5MB images, 10MB docs)
- User-specific S3 key prefixes

### Database Schema Notes

**Custom Schema**: `oppskills` (not default `public`)

**Key Tables**:
- `user` - User accounts synced from Clerk
- `hackathon` - Hackathon events
- `festival` - Festival events (parent of hackathons)
- `round` - Hackathon rounds/phases
- `team` - Participant teams
- `team_member` - Team membership
- `prize_breakdown` - Prize structure
- `registration_form` - Custom registration forms
- `registration_field` - Form field definitions
- `hackathon_role` - Manager/evaluator assignments

**Relationships**:
- Festival → Hackathons (1:N)
- Hackathon → Rounds (1:N)
- Hackathon → Teams (1:N)
- Hackathon → PrizeBreakdown (1:N)
- Hackathon → RegistrationForm (1:1)
- Team → TeamMembers (1:N)

### Lifecycle Status Enum

All events use consistent lifecycle status:

```typescript
enum LifecycleStatus {
  DRAFT      // Being created, not visible to public
  PUBLISHED  // Public, accepting registrations
  ONGOING    // Event is happening
  COMPLETED  // Event finished
  CANCELLED  // Event cancelled
}
```

**Workflow**: DRAFT → PUBLISHED → ONGOING → COMPLETED

**CANCELLED** can be set at any stage.

### Further Reading

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [Clerk Authentication](https://clerk.com/docs)
- [AWS S3 Presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Class Validator](https://github.com/typestack/class-validator)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-20
**Maintainer**: OppSkills Engineering Team
