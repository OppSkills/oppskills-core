# Authentication & Authorization

This document provides comprehensive coverage of authentication and authorization in the OppSkills platform, including Clerk integration, JWT verification, role-based access control, and security best practices.

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [Clerk JWT Authentication](#clerk-jwt-authentication)
3. [ClerkAuthGuard Implementation](#clerkauthguard-implementation)
4. [Development Auth Bypass](#development-auth-bypass)
5. [Authorization Levels](#authorization-levels)
6. [Role-Based Access Control](#role-based-access-control)
7. [Clerk Webhook Integration](#clerk-webhook-integration)
8. [Frontend Authentication](#frontend-authentication)
9. [Security Best Practices](#security-best-practices)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## Authentication Overview

OppSkills uses **Clerk** as its primary authentication provider for both frontend and backend. This provides:

- Secure user authentication via JWT tokens
- User management and lifecycle events
- Email verification and password management
- Session management
- OAuth integrations (future capability)

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │ ──────> │    Clerk     │ ──────> │   Backend   │
│  (Next.js)  │  Auth   │   (Auth)     │  JWT    │  (NestJS)   │
└─────────────┘         └──────────────┘         └─────────────┘
                               │
                               │ Webhooks
                               ↓
                        ┌──────────────┐
                        │  PostgreSQL  │
                        │  (User Sync) │
                        └──────────────┘
```

### Key Components

- **Frontend**: `@clerk/nextjs` for authentication UI and session management
- **Backend**: `@clerk/backend` for JWT verification
- **Database**: PostgreSQL stores synced user data via webhooks
- **Guards**: NestJS guards (`ClerkAuthGuard`, `AdminGuard`) protect routes

---

## Clerk JWT Authentication

### How It Works

1. **User authenticates** via Clerk on the frontend
2. **Clerk issues a JWT** containing user claims
3. **Frontend sends requests** with JWT in `Authorization` header
4. **Backend verifies JWT** using Clerk's secret key
5. **User data extracted** from verified claims and attached to request

### JWT Token Structure

Clerk JWTs contain standard claims plus custom fields:

```typescript
{
  sub: "user_2abc123",                    // User ID (subject)
  email: "user@example.com",              // Primary email
  emailAddresses: [                        // All email addresses
    {
      emailAddress: "user@example.com",
      verification: { status: "verified" }
    }
  ],
  iss: "https://clerk.example.com",       // Issuer
  iat: 1234567890,                        // Issued at
  exp: 1234567890,                        // Expiration
  // ... other claims
}
```

### Token Verification Flow

```typescript
// Backend verification using @clerk/backend
const sessionClaims = await verifyToken(token, {
  secretKey: process.env.CLERK_SECRET_KEY, // sk_test_* or sk_live_*
  clockSkewInMs: 15000, // Allow 15s clock drift
});

const userId = sessionClaims.sub; // Extract user ID
const email = sessionClaims.email; // Extract email
```

---

## ClerkAuthGuard Implementation

The `ClerkAuthGuard` is a NestJS guard that protects routes requiring authentication.

### Location

```
apps/backend/src/common/clerk-auth.guard.ts
```

### How It Works

```typescript
@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Check for development auth bypass (if enabled)
    if (AUTH_BYPASS is enabled) {
      // Handle bypass for dev/test environments
    }

    // 2. Extract token from Authorization header or query param
    const token = extractTokenFromHeader(request) ||
                  extractTokenFromQuery(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    // 3. Verify token using Clerk
    const sessionClaims = await verifyToken(token, {
      secretKey: this.configService.clerkSecretKey,
      clockSkewInMs: 15000
    });

    // 4. Extract user data from claims
    const userId = sessionClaims.sub;
    const email = sessionClaims.email ||
                  sessionClaims.emailAddresses?.[0]?.emailAddress;

    // 5. Attach user to request for use in controllers
    request.user = { id: userId, email };

    return true;
  }
}
```

### Token Extraction Methods

**From Authorization Header** (preferred):

```typescript
Authorization: Bearer<clerk_jwt_token>;
```

**From Query Parameter** (fallback for special cases):

```typescript
GET /api/resource?token=<clerk_jwt_token>
```

### Usage in Controllers

```typescript
@Controller("hackathons")
export class HackathonController {
  @Get()
  @UseGuards(ClerkAuthGuard) // Protect this route
  @ApiBearerAuth("clerk-auth") // Swagger documentation
  async getHackathons(@Request() req) {
    const userId = req.user.id; // Access authenticated user
    const email = req.user.email;
    // ... controller logic
  }
}
```

### Request Object Extension

After successful authentication, the guard adds:

```typescript
request.user = {
  id: string;      // Clerk user ID (e.g., "user_2abc123")
  email?: string;  // Primary email address
}
```

---

## Development Auth Bypass

For local development and testing, you can bypass Clerk authentication using the `AUTH_BYPASS` feature.

### Configuration

**Enable in `.env.local`:**

```bash
AUTH_BYPASS=true
NODE_ENV=development  # Required: only works in dev/test
```

### How to Use

Send an `X-User-Id` header with your requests:

```bash
curl -H "X-User-Id: test-user-123" \
     -H "X-User-Email: test@example.com" \
     http://localhost:3001/hackathons
```

### Behavior

1. **Environment Check**: Only works when `NODE_ENV` is `development` or `test`
2. **User Auto-Creation**: If user doesn't exist, it's automatically created in the database
3. **Request Attachment**: User data is attached to `request.user` just like normal auth
4. **Production Safety**: Explicitly blocked in production with error logging

### Security Safeguards

```typescript
// From clerk-auth.guard.ts
if (process.env.AUTH_BYPASS === "true") {
  const nodeEnv = process.env.NODE_ENV;
  const isProduction = nodeEnv === "production";

  if (isProduction) {
    // Log security warning and continue with normal auth
    this.logger.error("AUTH_BYPASS set in production - BLOCKED");
    // Falls through to normal JWT verification
  } else if (nodeEnv === "development" || nodeEnv === "test") {
    // Allow bypass
    const userId = request.header("x-user-id");
    // ... auto-create user and authenticate
  }
}
```

### Use Cases

- **Local Development**: Test APIs without Clerk credentials
- **Integration Tests**: Automate tests with predictable user IDs
- **cURL/Postman**: Quick API testing without generating JWTs
- **CI/CD Pipelines**: Simplified testing in non-production environments

---

## Authorization Levels

OppSkills implements a three-tier authorization system using the `AccessLevel` enum.

### Access Levels

```typescript
enum AccessLevel {
  ADMIN = "ADMIN", // Full system access
  USER = "USER", // Standard user (default)
  VIEWER = "VIEWER", // Read-only access
}
```

### Database Schema

```prisma
model UserEntity {
  id          String      @id @default(cuid())
  email       String      @unique
  accessLevel AccessLevel @default(USER) @map("access_level")
  // ... other fields
}
```

### Access Level Capabilities

| Level      | Capabilities                                                                                                                   |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **ADMIN**  | - Full system access<br>- Can manage all hackathons/festivals<br>- Can modify any user's content<br>- Administrative endpoints |
| **USER**   | - Create hackathons/festivals<br>- Manage own content<br>- Join teams<br>- Submit to hackathons                                |
| **VIEWER** | - Read-only access<br>- View public content<br>- Cannot create or modify                                                       |

### AdminGuard Implementation

The `AdminGuard` enforces ADMIN-level access:

**Location**: `apps/backend/src/common/admin.guard.ts`

```typescript
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.id;

    // Query database for user's access level
    const rows = await prisma.$queryRaw<
      Array<{ access_level: AccessLevelValue }>
    >`
      SELECT "access_level"
      FROM "oppskills"."user"
      WHERE "id" = ${userId}
      LIMIT 1
    `;

    const accessLevel = rows[0]?.access_level;

    if (accessLevel !== "ADMIN") {
      throw new ForbiddenException("Admin access required.");
    }

    return true;
  }
}
```

### Configuring Admin Users

**Environment Variable**:

```bash
# Comma-separated Clerk user IDs
ADMIN_USER_IDS=user_2abc123,user_2def456,user_2ghi789
```

**Config Service** (`apps/backend/src/common/config.service.ts`):

```typescript
get adminUserIds(): string[] {
  const raw = this.configService.get<string>('ADMIN_USER_IDS', '');
  return raw
    .split(',')
    .map(value => value.trim())
    .filter(value => value.length > 0);
}
```

### Usage

```typescript
@Controller("admin")
export class AdminController {
  @Get("users")
  @UseGuards(ClerkAuthGuard, AdminGuard) // Require both auth + admin
  async getAllUsers() {
    // Only accessible by ADMIN users
  }
}
```

### Design Philosophy

- **Database-Driven**: Authorization is stored in PostgreSQL, not Clerk metadata
- **Independent from Clerk**: Clerk handles authentication; OppSkills handles authorization
- **Granular Control**: Can be extended with custom permissions beyond the three levels
- **Stable**: Uses raw SQL to avoid type cache issues during migrations

---

## Role-Based Access Control

Beyond system-wide access levels, OppSkills implements **per-hackathon roles** for fine-grained access control.

### Hackathon Roles

```typescript
enum HackathonUserRole {
  MANAGER = "MANAGER", // Can manage hackathon settings and teams
  EVALUATOR = "EVALUATOR", // Can evaluate submissions
}
```

### Role Hierarchy

```
┌──────────────────────────────────────────────┐
│              ADMIN (System Level)            │
│  - Can manage all hackathons                 │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│              OWNER (Per-Hackathon)           │
│  - Created the hackathon                     │
│  - Full control over hackathon               │
│  - Can assign managers/evaluators            │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│             MANAGER (Per-Hackathon)          │
│  - Assigned by owner/admin                   │
│  - Can edit hackathon settings               │
│  - Can view/manage teams                     │
│  - Can manage registrations                  │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│            EVALUATOR (Per-Hackathon)         │
│  - Assigned by owner/admin                   │
│  - Can view submissions                      │
│  - Can evaluate teams                        │
│  - Read-only access to hackathon             │
└──────────────────────────────────────────────┘
```

### Database Schema

```prisma
model HackathonUserRoleEntity {
  id          String            @id @default(cuid())
  hackathonId String            @map("hackathon_id")
  hackathon   HackathonEntity   @relation(fields: [hackathonId])
  userId      String            @map("user_id")
  user        UserEntity        @relation(fields: [userId])
  role        HackathonUserRole
  createdAt   DateTime          @default(now())
  createdById String?
  createdBy   UserEntity?       @relation(fields: [createdById])

  @@unique([hackathonId, userId, role])
  @@map("hackathon_user_role")
}
```

### Role Assignment API

**Add Role**:

```typescript
POST /hackathons/:id/roles

{
  "email": "evaluator@example.com",
  "role": "EVALUATOR"
}
```

**Remove Role**:

```typescript
DELETE /hackathons/:id/roles

{
  "email": "evaluator@example.com",
  "role": "EVALUATOR"
}
```

**List Roles**:

```typescript
GET /hackathons/:id/roles

Response:
{
  "owner": {
    "id": "user_123",
    "email": "owner@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "imageUrl": "https://..."
  },
  "managers": [
    {
      "id": "user_456",
      "email": "manager@example.com",
      "role": "MANAGER",
      "assignedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "evaluators": [
    {
      "id": "user_789",
      "email": "evaluator@example.com",
      "role": "EVALUATOR",
      "assignedAt": "2025-01-15T11:00:00Z"
    }
  ]
}
```

### Permission Checks

```typescript
// Example: Check if user can manage hackathon
async function canManageHackathon(
  userId: string,
  hackathonId: string,
): Promise<boolean> {
  // 1. Check if user is system admin
  const user = await prisma.userEntity.findUnique({
    where: { id: userId },
  });
  if (user.accessLevel === "ADMIN") return true;

  // 2. Check if user is hackathon owner
  const hackathon = await prisma.hackathonEntity.findUnique({
    where: { id: hackathonId },
  });
  if (hackathon.organizerId === userId) return true;

  // 3. Check if user is a manager
  const managerRole = await prisma.hackathonUserRoleEntity.findUnique({
    where: {
      hackathonId_userId_role: {
        hackathonId,
        userId,
        role: "MANAGER",
      },
    },
  });

  return managerRole !== null;
}
```

### Frontend Usage

```typescript
// apps/ui-webapp/src/hooks/useHackathonRoles.ts
export function useHackathonRoles(hackathonId: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["hackathon-roles", hackathonId],
    queryFn: async () => {
      const token = await getToken();
      return getHackathonRoles(token, hackathonId);
    },
  });
}
```

---

## Clerk Webhook Integration

Clerk webhooks keep the local database synchronized with user lifecycle events.

### Webhook Events

OppSkills handles three primary events:

```typescript
enum ClerkWebhookEventType {
  USER_CREATED = "user.created",
  USER_UPDATED = "user.updated",
  USER_DELETED = "user.deleted",
}
```

### Webhook Flow

```
┌─────────┐         ┌──────────────┐         ┌──────────────┐
│  Clerk  │ ──────> │   Webhook    │ ──────> │  PostgreSQL  │
│         │  POST   │   Endpoint   │  Upsert │   Database   │
└─────────┘         └──────────────┘         └──────────────┘
                          │
                          │ Verify Signature
                          ↓
                    ┌──────────────┐
                    │ Svix Headers │
                    │  (Security)  │
                    └──────────────┘
```

### Webhook Endpoint

**Location**: `apps/backend/src/user-accounts/user-accounts.controller.ts`

```typescript
@Post('/clerk-webhook')
create(
  @Body() payload: ClerkWebhookRequestDto,
  @Headers('svix-id') svixId: string,
  @Headers('svix-timestamp') svixTimestamp: string,
  @Headers('svix-signature') svixSignature: string
) {
  return this.userAccountsService.handleClerkWebhook(
    payload,
    svixId,
    svixTimestamp,
    svixSignature
  );
}
```

### Signature Verification

Webhooks are secured using Svix signatures to prevent spoofing:

```typescript
private async verifyWebhookSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string
): Promise<boolean> {
  // 1. Construct signed content
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;

  // 2. Extract secret bytes (base64 encoded)
  const secretBytes = Buffer.from(
    clerkWebhookSecret.split('_')[1],
    'base64'
  );

  // 3. Generate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  // 4. Compare signatures (timing-safe)
  const signatures = svixSignature.split(' ')
    .map(sig => sig.split(',')[1])
    .filter(Boolean);

  return signatures.some(actualSignature =>
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(actualSignature)
    )
  );
}
```

### Event Handlers

**User Created**:

```typescript
case ClerkWebhookEventType.USER_CREATED: {
  const userId = payload.data.id;
  const primaryEmail = payload.data.email_addresses.find(
    email => email.verification.status === 'verified'
  )?.email_address;

  await prisma.userEntity.create({
    data: {
      id: userId,
      email: primaryEmail,
      firstName: payload.data.first_name,
      lastName: payload.data.last_name,
      imageUrl: payload.data.image_url,
      accessLevel: 'USER'  // Default access level
    }
  });
}
```

**User Updated**:

```typescript
case ClerkWebhookEventType.USER_UPDATED: {
  await prisma.userEntity.update({
    where: { id: payload.data.id },
    data: {
      email: primaryEmail,
      firstName: payload.data.first_name,
      lastName: payload.data.last_name,
      imageUrl: payload.data.image_url
    }
  });
}
```

**User Deleted**:

```typescript
case ClerkWebhookEventType.USER_DELETED: {
  await prisma.userEntity.delete({
    where: { id: payload.data.id }
  });
}
```

### Configuration

**Environment Variables**:

```bash
# Clerk webhook signing secret (whsec_...)
CLERK_WEBHOOK_SECRET=whsec_abc123...
```

**Clerk Dashboard Setup**:

1. Navigate to Webhooks in Clerk Dashboard
2. Add endpoint: `https://api.yourapp.com/user-accounts/clerk-webhook`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy webhook signing secret to `CLERK_WEBHOOK_SECRET`

### Local Testing

Use Svix CLI to forward webhooks to localhost:

```bash
# Install Svix CLI
npm install -g svix-cli

# Start listener
svix listen http://localhost:3001/user-accounts/clerk-webhook

# Copy webhook URL from output and add to Clerk Dashboard
```

---

## Frontend Authentication

The Next.js frontend uses `@clerk/nextjs` for seamless authentication.

### Setup

**Root Layout** (`apps/ui-webapp/src/app/layout.tsx`):

```typescript
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Client-Side Authentication

**Get User Information**:

```typescript
'use client';
import { useUser } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <div>Loading...</div>;
  if (!user) return <div>Not signed in</div>;

  return (
    <div>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
      <p>Name: {user.firstName} {user.lastName}</p>
    </div>
  );
}
```

**Get Authentication Token**:

```typescript
"use client";
import { useAuth } from "@clerk/nextjs";

export function useApiCall() {
  const { getToken } = useAuth();

  async function callApi() {
    const token = await getToken();

    const response = await fetch("/api/hackathons", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.json();
  }

  return { callApi };
}
```

### Server-Side Authentication

**Server Components**:

```typescript
import { auth } from '@clerk/nextjs/server';

export default async function ServerPage() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Not authenticated</div>;
  }

  // Fetch user-specific data
  return <div>Welcome, user {userId}</div>;
}
```

**API Routes**:

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Handle authenticated request
  return NextResponse.json({ userId });
}
```

### Protected Routes

Create a middleware for route protection:

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/api/hackathons(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
```

### Sign In/Out Components

```typescript
import { SignInButton, SignOutButton, UserButton } from '@clerk/nextjs';

export function Header() {
  return (
    <header>
      <SignInButton mode="modal">
        <button>Sign In</button>
      </SignInButton>

      <UserButton afterSignOutUrl="/" />

      <SignOutButton>
        <button>Sign Out</button>
      </SignOutButton>
    </header>
  );
}
```

### API Integration Helper

**API Client** (`apps/ui-webapp/src/lib/api/apiClient.ts`):

```typescript
export function buildAuthHeaders(token: string): { Authorization: string } {
  const safeToken = token.trim();
  if (safeToken.length === 0) {
    throw new Error("Auth token is empty.");
  }
  return { Authorization: `Bearer ${safeToken}` };
}

export function createApiClient(resourcePath: string): AxiosInstance {
  const baseURL = `${getApiRootUrl()}${resourcePath}`;
  return axios.create({ baseURL });
}
```

**Usage**:

```typescript
import { useAuth } from "@clerk/nextjs";
import { buildAuthHeaders, createApiClient } from "@/lib/api/apiClient";

const API = createApiClient("/hackathons");

export function useHackathons() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["hackathons"],
    queryFn: async () => {
      const token = await getToken();
      const response = await API.get("/", {
        headers: buildAuthHeaders(token),
      });
      return response.data;
    },
  });
}
```

---

## Security Best Practices

### 1. Environment Variables

**Never commit secrets**:

```bash
# .env.local (gitignored)
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
DATABASE_URL=postgresql://...
ADMIN_USER_IDS=user_123,user_456
```

**Use different keys per environment**:

- Development: `sk_test_...`
- Production: `sk_live_...`

### 2. Token Handling

**Always use Bearer authentication**:

```typescript
// Correct
Authorization: Bearer <token>

// Incorrect
Authorization: <token>
X-Auth-Token: <token>
```

**Never log tokens**:

```typescript
// BAD
console.log("Token:", token);

// GOOD
console.log("Token received:", !!token);
```

### 3. Webhook Security

**Always verify signatures**:

```typescript
if (!await verifyWebhookSignature(...)) {
  throw new UnauthorizedException('Invalid signature');
}
```

**Use timing-safe comparison**:

```typescript
crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(actual));
```

### 4. Authorization Checks

**Check permissions at multiple layers**:

```typescript
// 1. Guard level (authentication)
@UseGuards(ClerkAuthGuard)

// 2. Guard level (authorization)
@UseGuards(AdminGuard)

// 3. Service level (business logic)
async updateHackathon(userId: string, hackathonId: string) {
  const canEdit = await this.canUserEditHackathon(userId, hackathonId);
  if (!canEdit) {
    throw new ForbiddenException();
  }
  // ... update logic
}
```

**Never trust client-side checks alone**:

```typescript
// Frontend can be bypassed - always verify on backend
async function deleteHackathon(id: string) {
  // Backend will verify user has permission
  await api.delete(`/hackathons/${id}`);
}
```

### 5. Database Security

**Use parameterized queries**:

```typescript
// GOOD - Prisma handles escaping
const user = await prisma.userEntity.findUnique({
  where: { id: userId },
});

// GOOD - Raw query with parameters
const rows = await prisma.$queryRaw`
  SELECT * FROM "oppskills"."user"
  WHERE "id" = ${userId}
`;

// BAD - SQL injection risk
const rows = await prisma.$queryRawUnsafe(
  `SELECT * FROM user WHERE id = '${userId}'`,
);
```

**Principle of least privilege**:

```typescript
// Only select needed fields
const user = await prisma.userEntity.findUnique({
  where: { id },
  select: {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    // Don't expose sensitive fields
  },
});
```

### 6. Production Safeguards

**Disable auth bypass**:

```bash
# NEVER set in production
AUTH_BYPASS=false  # or omit entirely

# Enforce production mode
NODE_ENV=production
```

**Validate environment on startup**:

```typescript
if (process.env.NODE_ENV === "production") {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY required in production");
  }
  if (process.env.AUTH_BYPASS === "true") {
    throw new Error("AUTH_BYPASS not allowed in production");
  }
}
```

### 7. Rate Limiting

Consider implementing rate limiting for auth endpoints:

```typescript
// Example with @nestjs/throttler
@Throttle({ default: { limit: 10, ttl: 60000 } })
@Post('/clerk-webhook')
async handleWebhook() {
  // ...
}
```

---

## Common Issues & Solutions

### Issue 1: "Unauthorized" on Valid Requests

**Symptoms**:

- Frontend receives 401 Unauthorized
- Token appears valid in Clerk Dashboard

**Possible Causes**:

1. Token not sent in request
2. Wrong token format (missing "Bearer" prefix)
3. Expired token
4. Clock skew between systems

**Solutions**:

```typescript
// Check token is being sent
const { getToken } = useAuth();
const token = await getToken();
console.log('Token exists:', !!token);

// Verify Bearer prefix
headers: {
  'Authorization': `Bearer ${token}`  // Must include "Bearer "
}

// Backend: Increase clock skew tolerance
await verifyToken(token, {
  secretKey: secretKey,
  clockSkewInMs: 15000  // Allow 15 seconds
});

// Check token expiration
const claims = await verifyToken(token, { secretKey });
console.log('Expires:', new Date(claims.exp * 1000));
```

### Issue 2: Webhook Signature Verification Fails

**Symptoms**:

- Webhooks return 401 Unauthorized
- Signature verification fails

**Possible Causes**:

1. Wrong webhook secret
2. Secret format incorrect (missing `whsec_` prefix)
3. Payload modification (e.g., by proxy/middleware)

**Solutions**:

```bash
# Verify webhook secret format
CLERK_WEBHOOK_SECRET=whsec_abc123...  # Must start with whsec_

# Test with Svix CLI locally
svix listen http://localhost:3001/user-accounts/clerk-webhook

# Check raw body is used (not parsed)
@Post('/clerk-webhook')
create(@Body() payload: ClerkWebhookRequestDto) {
  // Verify with stringified payload
  const payloadString = JSON.stringify(payload);
  const isValid = await verifySignature(payloadString, ...);
}
```

### Issue 3: User Not Found in Database

**Symptoms**:

- JWT verifies successfully
- User query returns null

**Possible Causes**:

1. Webhook not received/processed
2. User created in Clerk but webhook failed
3. Database connection issue

**Solutions**:

```typescript
// Auto-create user on first API call
const user = await prisma.userEntity.upsert({
  where: { id: userId },
  update: {},
  create: {
    id: userId,
    email: email,
    accessLevel: 'USER'
  }
});

// Check webhook endpoint is accessible
curl -X POST https://api.yourapp.com/user-accounts/clerk-webhook

// Monitor webhook delivery in Clerk Dashboard
// Dashboard > Webhooks > View Logs
```

### Issue 4: AUTH_BYPASS Not Working

**Symptoms**:

- `AUTH_BYPASS=true` but still getting 401

**Possible Causes**:

1. `NODE_ENV` is not `development` or `test`
2. Missing `X-User-Id` header
3. Header case sensitivity

**Solutions**:

```bash
# Check environment
echo $NODE_ENV  # Must be "development" or "test"

# Send header (lowercase)
curl -H "x-user-id: test-user" \
     http://localhost:3001/hackathons

# Verify in logs
# Should see: "AUTH_BYPASS active; authenticated user"
```

### Issue 5: Admin Access Not Working

**Symptoms**:

- User should be admin but gets 403 Forbidden

**Possible Causes**:

1. User ID not in `ADMIN_USER_IDS`
2. `access_level` not set to `ADMIN` in database
3. Typo in user ID

**Solutions**:

```bash
# Verify environment variable
echo $ADMIN_USER_IDS  # Should contain user's Clerk ID

# Check database
SELECT id, email, access_level
FROM "user"."user"
WHERE id = 'user_123';

# Update access level manually if needed
UPDATE "user"."user"
SET access_level = 'ADMIN'
WHERE id = 'user_123';
```

### Issue 6: Token Works in Frontend but Not in API Calls

**Symptoms**:

- User can access protected pages
- API calls return 401

**Possible Causes**:

1. Token not attached to API requests
2. Wrong API base URL
3. CORS issues

**Solutions**:

```typescript
// Always get fresh token for API calls
const { getToken } = useAuth();

async function callApi() {
  const token = await getToken(); // Fresh token

  const response = await fetch("/api/hackathons", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

// Check CORS configuration
// Backend main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

### Issue 7: Role Assignment Not Persisting

**Symptoms**:

- User assigned as manager/evaluator
- Role disappears or not visible

**Possible Causes**:

1. Transaction rollback
2. Unique constraint violation
3. User doesn't exist in database

**Solutions**:

```typescript
// Ensure user exists before assigning role
const user = await prisma.userEntity.findUnique({
  where: { email: "manager@example.com" },
});

if (!user) {
  throw new NotFoundException("User not found");
}

// Use upsert to handle duplicates
await prisma.hackathonUserRoleEntity.upsert({
  where: {
    hackathonId_userId_role: {
      hackathonId,
      userId: user.id,
      role: "MANAGER",
    },
  },
  update: {},
  create: {
    hackathonId,
    userId: user.id,
    role: "MANAGER",
  },
});
```

### Issue 8: Frontend Shows User as Signed Out

**Symptoms**:

- User was signed in
- Suddenly shows as signed out
- Session appears lost

**Possible Causes**:

1. Session expired
2. Clerk public key mismatch
3. Browser cookies cleared

**Solutions**:

```typescript
// Check session status
const { isLoaded, isSignedIn } = useAuth();

if (isLoaded && !isSignedIn) {
  // Redirect to sign in
  router.push('/sign-in');
}

// Verify Clerk publishable key
// .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

// Check session expiration settings in Clerk Dashboard
// Settings > Sessions > Session lifetime
```

---

## Additional Resources

### Documentation

- [Clerk Documentation](https://clerk.com/docs)
- [NestJS Guards](https://docs.nestjs.com/guards)
- [Prisma Schema](https://www.prisma.io/docs/concepts/components/prisma-schema)

### Related Files

**Backend**:

- `/apps/backend/src/common/clerk-auth.guard.ts` - JWT verification
- `/apps/backend/src/common/admin.guard.ts` - Admin authorization
- `/apps/backend/src/common/config.service.ts` - Configuration
- `/apps/backend/src/user-accounts/user-accounts.service.ts` - Webhook handling
- `/apps/backend/src/user-accounts/user-accounts.controller.ts` - Webhook endpoint

**Frontend**:

- `/apps/ui-webapp/src/app/layout.tsx` - ClerkProvider setup
- `/apps/ui-webapp/src/lib/api/apiClient.ts` - API authentication
- `/apps/ui-webapp/src/components/layout/site-header.tsx` - User UI

**Database**:

- `/packages/database/prisma/schema.prisma` - User and role schemas

**Types**:

- `/packages/types/src/dtos/backend/account/clerk-webhook.dto.ts` - Webhook types
- `/packages/types/src/dtos/backend/hackathon/hackathon-roles.dto.ts` - Role types
- `/packages/types/src/enums/index.ts` - AccessLevel enum

### Environment Variables Reference

```bash
# Clerk Configuration
CLERK_SECRET_KEY=sk_test_...           # Backend JWT verification
CLERK_WEBHOOK_SECRET=whsec_...         # Webhook signature verification
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...  # Frontend Clerk instance

# Authorization
ADMIN_USER_IDS=user_123,user_456       # Comma-separated admin user IDs

# Development
AUTH_BYPASS=true                        # Enable dev auth bypass (dev/test only)
NODE_ENV=development                    # Environment (development/test/production)

# Database
DATABASE_URL=postgresql://...           # PostgreSQL connection string
```

---

## Conclusion

OppSkills implements a robust, multi-layered authentication and authorization system:

1. **Authentication** via Clerk JWT tokens
2. **System-level authorization** via AccessLevel (ADMIN/USER/VIEWER)
3. **Resource-level authorization** via hackathon roles (OWNER/MANAGER/EVALUATOR)
4. **Webhook synchronization** for user lifecycle management
5. **Development tools** for simplified testing

This architecture provides security, flexibility, and scalability while maintaining a clean separation between authentication (Clerk) and authorization (OppSkills database).
