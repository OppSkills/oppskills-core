# Database Schema Documentation

This document provides comprehensive documentation of the OppSkills database schema using Prisma ORM and PostgreSQL.

## Database Configuration

- **Provider**: PostgreSQL
- **Schema Name**: `oppskills` (custom schema, not "public")
- **ORM**: Prisma 6.2.3
- **Binary Targets**: `["native", "linux-musl-openssl-3.0.x"]` (for Docker/Alpine)

## Enums

### AccessLevel

User access control levels for internal system permissions.

```prisma
enum AccessLevel {
  ADMIN   // Full system access, configured via ADMIN_USER_IDS
  USER    // Standard user (default)
  VIEWER  // Read-only access
}
```

### LifecycleStatus

Lifecycle stages for events (hackathons and festivals).

```prisma
enum LifecycleStatus {
  DRAFT       // Being created, not visible to public
  PUBLISHED   // Public and accepting registrations
  ONGOING     // Event is currently happening
  COMPLETED   // Event finished successfully
  CANCELLED   // Event cancelled
}
```

**State Machine**:

- `DRAFT` → `PUBLISHED` → `ONGOING` → `COMPLETED`
- Any status can transition to `CANCELLED`
- `COMPLETED` and `CANCELLED` are terminal states

### Visibility

Access control for hackathons.

```prisma
enum Visibility {
  PUBLIC           // Anyone can see and register
  PRIVATE          // Invitation only
  UNIVERSITY_ONLY  // Restricted to specific universities (allowedUniversities)
}
```

### HackathonMode

Participation mode for hackathons.

```prisma
enum HackathonMode {
  ONLINE   // Virtual participation
  OFFLINE  // Physical location
  HYBRID   // Both online and offline
}
```

### HackathonType

Category of hackathon.

```prisma
enum HackathonType {
  CODING_HACKATHON           // Programming challenges
  IDEA_HACKATHON             // Ideation and pitching
  CASE_STUDY_COMPETITION     // Business case analysis
  DESIGN_HACKATHON           // UI/UX design challenges
  OPEN_HACKATHON             // Any type of challenge
}
```

### ParticipantType

Team size configuration.

```prisma
enum ParticipantType {
  INDIVIDUAL      // Solo participants
  TEAM_OF_2       // Teams of exactly 2
  TEAM_OF_3       // Teams of exactly 3
  TEAM_OF_4       // Teams of exactly 4
  TEAM_OF_5       // Teams of exactly 5
  TEAM_OF_6       // Teams of exactly 6
  MORE_THAN_6     // Teams larger than 6
}
```

### LocationType

Event location type.

```prisma
enum LocationType {
  PHYSICAL  // Physical venue (requires address, city)
  VIRTUAL   // Online event (requires virtual link)
}
```

### RoundStatus

Status of hackathon rounds.

```prisma
enum RoundStatus {
  UPCOMING   // Not started yet
  ONGOING    // Currently active
  COMPLETED  // Finished
}
```

### RegistrationFieldType

Custom registration form field types.

```prisma
enum RegistrationFieldType {
  TEXT         // Short text input
  PHONE_NO     // Phone number input
  EMAIL        // Email input
  NUMBER       // Numeric input
  ATTACHMENTS  // File upload field
  OPTIONS      // Multiple choice (dropdown/radio)
}
```

### HackathonAttendeeEligibility

Eligibility criteria for participants (multi-select).

```prisma
enum HackathonAttendeeEligibility {
  EVERYONE_CAN_APPLY  // Open to all
  SCHOOL_STUDENTS     // High school students
  COLLEGE_STUDENTS    // University/college students
  FRESHERS            // Fresh graduates (0-2 years experience)
  PROFESSIONALS       // Working professionals
}
```

### HackathonRoundType

Type of hackathon round.

```prisma
enum HackathonRoundType {
  ONLINE        // Virtual round (link submission, coding challenge)
  OFFLINE       // Physical attendance required
  PRESENTATION  // Presentation/demo round
}
```

### HackathonUserRole

Per-hackathon role assignments.

```prisma
enum HackathonUserRole {
  MANAGER    // Can edit hackathon in DRAFT status, view registrations
  EVALUATOR  // Can evaluate submissions (future implementation)
}
```

## Core Entities

### UserEntity

Central user model synced from Clerk.

```prisma
model UserEntity {
  id          String      @id // Clerk user ID (e.g., user_abc123)
  email       String      @unique
  imageUrl    String?
  firstName   String?
  lastName    String?
  accessLevel AccessLevel @default(USER)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  hackathons       HackathonEntity[]           // Owned hackathons
  festivals        FestivalEntity[]            // Owned festivals
  teams            TeamEntity[]                // Teams created as leader
  teamMembers      TeamMemberEntity[]          // Teams joined as member
  hackathonRoles   HackathonUserRoleEntity[]   // Manager/Evaluator assignments
  createdRoles     HackathonUserRoleEntity[]   @relation("CreatedRoles") // Roles they assigned

  @@map("UserEntity")
}
```

**Key Points**:

- `id` is Clerk user ID (not auto-generated)
- Synced via Clerk webhook (`/user-accounts/clerk-webhook`)
- `accessLevel` used for admin access (ADMIN users configured via `ADMIN_USER_IDS`)
- Soft-deleted in webhook if Clerk user is deleted

### FestivalEntity

Top-level event container (e.g., tech conferences).

```prisma
model FestivalEntity {
  id          String           @id @default(cuid())
  slug        String           @unique
  name        String
  description String?          @db.Text

  // Media
  posterImageUrl String?
  websiteUrl     String?

  // Location
  locationType        LocationType
  locationAddress     String?
  locationCity        String?
  locationVirtualLink String?

  // Schedule
  startDate DateTime
  endDate   DateTime

  // Organization
  organizerId         String
  organizer           UserEntity @relation(fields: [organizerId], references: [id], onDelete: Cascade)
  organizationName    String?
  organizationLogoUrl String?

  // Lifecycle
  status LifecycleStatus @default(DRAFT)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  hackathons HackathonEntity[] // Nested hackathons

  @@map("FestivalEntity")
}
```

**Key Points**:

- Can contain multiple hackathons
- Slug must be unique
- Location can be PHYSICAL or VIRTUAL
- Lifecycle managed via `status` field

### HackathonEntity

Core event model (standalone or festival-nested).

```prisma
model HackathonEntity {
  id          String           @id @default(cuid())
  slug        String           @unique
  name        String
  description String?          @db.Text

  // Schedule
  startDate DateTime
  endDate   DateTime
  mode      HackathonMode

  // Ownership
  ownerId  String
  owner    UserEntity @relation(fields: [ownerId], references: [id], onDelete: Cascade)

  // Festival Association (nullable for standalone hackathons)
  festivalId String?
  festival   FestivalEntity? @relation(fields: [festivalId], references: [id], onDelete: Cascade)

  // Media
  bannerImageUrl String?

  // Visibility & Type
  visibility     Visibility
  hackathonType  HackathonType
  participantType ParticipantType

  // Location
  locationType        LocationType
  locationAddress     String?
  locationCity        String?
  locationVirtualLink String?

  // Registration
  registrationDeadline      DateTime?
  externalRegistrationLink  String?

  // Pricing
  isFree         Boolean @default(true)
  entryFeeAmount Decimal? @db.Decimal(10, 2)
  currency       String?  @default("INR")

  // Prizes
  prizeTotalWorthAmount Decimal? @db.Decimal(12, 2)
  prizeDescription      Json?    // Rich text (TipTap JSON)
  prizeCertificate      Boolean  @default(false)

  // Organization
  organizationName    String?
  organizationLogoUrl String?

  // Restrictions
  allowedUniversities String[] // For UNIVERSITY_ONLY visibility

  // Eligibility (multi-select)
  attendeeEligibility HackathonAttendeeEligibility[]

  // Team Limits
  maxTeams Int? // null = unlimited

  // Contact Info
  contactName  String?
  contactEmail String?
  contactPhone String?

  // Metrics
  impressions        Int @default(0)
  registrationCount  Int @default(0)

  // Lifecycle
  status LifecycleStatus @default(DRAFT)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  rounds           RoundEntity[]
  prizeBreakdown   PrizeBreakdownEntity[]
  registrationForm RegistrationFormEntity?
  attachments      HackathonAttachmentEntity[]
  teams            TeamEntity[]
  userRoles        HackathonUserRoleEntity[] // Managers & Evaluators

  @@map("HackathonEntity")
}
```

**Key Points**:

- Can be standalone (`festivalId = null`) or festival-nested
- Slug auto-generated from name with uniqueness guarantee
- Default rounds (3) auto-generated if not provided
- Structural changes only allowed in `DRAFT` status
- Owner cannot create teams in their own hackathon
- Max teams limit enforced at team creation

### RoundEntity

Hackathon stages (e.g., Round 1, Finals).

```prisma
model RoundEntity {
  id          String @id @default(cuid())
  hackathonId String
  hackathon   HackathonEntity @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  name        String
  description String? @db.Text

  // Schedule
  startsAt DateTime
  endsAt   DateTime

  // Ordering
  order Int // Unique per hackathon (0-indexed)

  // Status
  status RoundStatus @default(UPCOMING)

  // Type
  roundType HackathonRoundType

  // Submission Configuration (JSON)
  submissionConfig Json? // { requiresFileUpload, allowedFileTypes, maxFileSizeBytes, requiresLinkSubmission, requiresDescription, instructions }

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([hackathonId, order]) // Ensures unique ordering per hackathon
  @@map("RoundEntity")
}
```

**Key Points**:

- Each round has unique `order` within a hackathon
- Timeline (`startsAt`, `endsAt`) must fit within hackathon dates
- `submissionConfig` stores JSON for file upload rules, instructions, etc.
- Default: 3 rounds auto-generated if not provided

**Example submissionConfig**:

```json
{
  "requiresFileUpload": true,
  "allowedFileTypes": ["application/pdf", "image/png"],
  "maxFileSizeBytes": 10485760,
  "requiresLinkSubmission": false,
  "requiresDescription": true,
  "instructions": "Upload your project synopsis as PDF"
}
```

### RegistrationFormEntity

Custom registration form configuration.

```prisma
model RegistrationFormEntity {
  id            String @id @default(cuid())
  hackathonId   String @unique
  hackathon     HackathonEntity @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  // External Form Link (Google Forms, Typeform, etc.)
  externalFormLink String?

  // Custom Fields
  fields RegistrationFieldEntity[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("RegistrationFormEntity")
}
```

**Key Points**:

- One per hackathon (1:1 relationship)
- Can use `externalFormLink` for third-party forms
- Or use custom `fields` for built-in forms
- Fields can be both (external + custom)

### RegistrationFieldEntity

Custom registration form fields.

```prisma
model RegistrationFieldEntity {
  id     String @id @default(cuid())
  formId String
  form   RegistrationFormEntity @relation(fields: [formId], references: [id], onDelete: Cascade)

  label       String
  type        RegistrationFieldType
  required    Boolean @default(false)
  order       Int     // Unique per form
  options     String[] // For type=OPTIONS (dropdown/radio)
  placeholder String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([formId, order]) // Ensures unique ordering per form
  @@map("RegistrationFieldEntity")
}
```

**Example Custom Field**:

```typescript
{
  label: "T-Shirt Size",
  type: "OPTIONS",
  required: true,
  order: 0,
  options: ["S", "M", "L", "XL", "XXL"],
  placeholder: "Select your size"
}
```

### PrizeBreakdownEntity

Prize distribution details.

```prisma
model PrizeBreakdownEntity {
  id          String @id @default(cuid())
  hackathonId String
  hackathon   HackathonEntity @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  position    String  // e.g., "1st Place", "Runner Up", "Best Innovation"
  amount      Decimal @db.Decimal(12, 2)
  description String? @db.Text

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("PrizeBreakdownEntity")
}
```

**Example Prize Breakdown**:

```typescript
[
  { position: "1st Place", amount: 100000, description: "Grand Prize" },
  { position: "2nd Place", amount: 50000, description: "Runner Up" },
  { position: "Best Innovation", amount: 25000, description: "Special Award" },
];
```

### TeamEntity

Team registration for hackathons.

```prisma
model TeamEntity {
  id          String @id @default(cuid())
  name        String
  maxSize     Int

  hackathonId String
  hackathon   HackathonEntity @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  leaderId String
  leader   UserEntity @relation(fields: [leaderId], references: [id], onDelete: Cascade)

  // Relations
  members TeamMemberEntity[]

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("TeamEntity")
}
```

**Constraints**:

- Hackathon owner cannot create teams in own hackathon
- Max teams limit (`hackathon.maxTeams`) enforced at creation
- Team size limit (`maxSize`) enforced at join time

### TeamMemberEntity

Team membership (many-to-many: users ↔ teams).

```prisma
model TeamMemberEntity {
  userId String
  user   UserEntity @relation(fields: [userId], references: [id], onDelete: Cascade)

  teamId String
  team   TeamEntity @relation(fields: [teamId], references: [id], onDelete: Cascade)

  joinedAt DateTime @default(now())

  @@id([userId, teamId]) // Composite primary key
  @@unique([userId, teamId]) // Prevents duplicate memberships
  @@map("TeamMemberEntity")
}
```

**Constraints**:

- User can only join a team once (unique constraint)
- Leader cannot join their own team as member
- Cannot join if team is full (`members.length >= team.maxSize`)

### HackathonAttachmentEntity

File attachments for hackathons (S3-ready).

```prisma
model HackathonAttachmentEntity {
  id          String @id @default(cuid())
  hackathonId String
  hackathon   HackathonEntity @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  // S3 Storage
  storageKey String  // S3 key (e.g., public/hackathon-docs/user_123/doc-uuid.pdf)
  publicUrl  String  // CloudFront CDN URL

  // File Metadata
  fileName  String
  mimeType  String
  sizeBytes Int

  // Timestamps
  createdAt DateTime @default(now())

  @@map("HackathonAttachmentEntity")
}
```

**Upload Flow**:

1. Frontend requests presigned URL: `POST /media/presign-document-upload`
2. Backend generates S3 presigned POST
3. Frontend uploads directly to S3
4. Frontend stores `publicUrl` in database

### HackathonUserRoleEntity

Per-hackathon role assignments (managers, evaluators).

```prisma
model HackathonUserRoleEntity {
  hackathonId String
  hackathon   HackathonEntity @relation(fields: [hackathonId], references: [id], onDelete: Cascade)

  userId String
  user   UserEntity @relation(fields: [userId], references: [id], onDelete: Cascade)

  role HackathonUserRole // MANAGER or EVALUATOR

  // Audit Trail
  createdById String
  createdBy   UserEntity @relation("CreatedRoles", fields: [createdById], references: [id], onDelete: Cascade)
  assignedAt  DateTime   @default(now())

  @@id([hackathonId, userId, role]) // Composite primary key
  @@unique([hackathonId, userId, role]) // Prevents duplicate role assignments
  @@map("HackathonUserRoleEntity")
}
```

**Key Points**:

- Assigned via email lookup: `GET /user-accounts/search?q=email`
- Owner cannot be assigned manager/evaluator role
- Idempotent: Adding existing role returns success
- Managers can edit hackathons in DRAFT status
- Evaluators planned for future (submission evaluation)

## Relationships Summary

```
UserEntity (1:N)
  ├─── hackathons[] → HackathonEntity
  ├─── festivals[] → FestivalEntity
  ├─── teams[] (as leader) → TeamEntity
  ├─── teamMembers[] → TeamMemberEntity
  └─── hackathonRoles[] → HackathonUserRoleEntity

FestivalEntity (1:N)
  └─── hackathons[] → HackathonEntity

HackathonEntity (1:N)
  ├─── rounds[] → RoundEntity
  ├─── prizeBreakdown[] → PrizeBreakdownEntity
  ├─── registrationForm? (1:1) → RegistrationFormEntity
  ├─── attachments[] → HackathonAttachmentEntity
  ├─── teams[] → TeamEntity
  └─── userRoles[] → HackathonUserRoleEntity

TeamEntity (1:N)
  └─── members[] → TeamMemberEntity

RegistrationFormEntity (1:N)
  └─── fields[] → RegistrationFieldEntity
```

## Indexes

Prisma automatically creates indexes for:

- `@id` fields (primary keys)
- `@unique` fields (unique constraints)
- Foreign keys (`@relation` fields)
- Composite keys (`@@unique`, `@@id`)

**Manual Indexes** (if needed, add to schema):

```prisma
@@index([status]) // For filtering by status
@@index([startDate, endDate]) // For date range queries
@@index([email]) // For user search (already unique, but good for lookups)
```

## Database Connection

### Local Development

```env
DATABASE_URL="postgresql://oppskills:oppskills@localhost:5434/oppskills?schema=oppskills"
```

### Production

```env
DATABASE_URL="postgresql://user:password@host:5432/database?schema=oppskills&sslmode=require"
```

**Important**: Always use `schema=oppskills` in connection string!

## Migrations

### Development Workflow

```bash
# Edit schema.prisma
vim packages/database/prisma/schema.prisma

# Generate Prisma client
pnpm db:generate

# Push schema (dev only, no migration files)
pnpm db:push
```

### Production Workflow

```bash
# Edit schema.prisma
vim packages/database/prisma/schema.prisma

# Generate Prisma client
pnpm db:generate

# Create migration
pnpm db:migrate

# Apply migration (production)
pnpm db:migrate:deploy
```

## Common Queries

### Get Hackathons with Rounds

```typescript
const hackathons = await prisma.hackathonEntity.findMany({
  include: {
    rounds: {
      orderBy: { order: "asc" },
    },
    owner: true,
    festival: true,
  },
});
```

### Get Team with Members

```typescript
const team = await prisma.teamEntity.findUnique({
  where: { id: teamId },
  include: {
    leader: true,
    members: {
      include: { user: true },
    },
    hackathon: true,
  },
});
```

### Get User's Hackathons (Owned + Managed)

```typescript
const hackathons = await prisma.hackathonEntity.findMany({
  where: {
    OR: [
      { ownerId: userId },
      { userRoles: { some: { userId, role: "MANAGER" } } },
    ],
  },
  include: {
    rounds: true,
    teams: true,
    userRoles: { include: { user: true } },
  },
});
```

### Create Hackathon with Nested Data

```typescript
const hackathon = await prisma.hackathonEntity.create({
  data: {
    name: "AI Hackathon",
    slug: "ai-hackathon-2025",
    ownerId: userId,
    startDate: new Date("2025-06-01"),
    endDate: new Date("2025-06-03"),
    mode: "HYBRID",
    visibility: "PUBLIC",
    hackathonType: "CODING_HACKATHON",
    participantType: "TEAM_OF_4",
    locationType: "PHYSICAL",
    locationCity: "San Francisco",
    rounds: {
      create: [
        {
          name: "Round 1",
          order: 0,
          startsAt: new Date("2025-06-01"),
          endsAt: new Date("2025-06-01"),
          roundType: "ONLINE",
        },
        {
          name: "Round 2",
          order: 1,
          startsAt: new Date("2025-06-02"),
          endsAt: new Date("2025-06-02"),
          roundType: "OFFLINE",
        },
        {
          name: "Finals",
          order: 2,
          startsAt: new Date("2025-06-03"),
          endsAt: new Date("2025-06-03"),
          roundType: "PRESENTATION",
        },
      ],
    },
    prizeBreakdown: {
      create: [
        { position: "1st Place", amount: 100000, description: "Grand Prize" },
        { position: "2nd Place", amount: 50000, description: "Runner Up" },
      ],
    },
  },
});
```

## Schema Evolution Best Practices

### Adding Optional Fields

```prisma
// Safe: Won't break existing data
model HackathonEntity {
  newField String? // Optional
}
```

### Adding Required Fields

```prisma
// Risky: Requires default value or data backfill
model HackathonEntity {
  newField String @default("default-value")
}
```

### Renaming Fields

```prisma
// Use @map to preserve DB column name
model HackathonEntity {
  newName String @map("old_name")
}
```

### Deleting Fields

```bash
# 1. Deploy migration removing field from code
# 2. Wait for all app instances to update
# 3. Manually drop column in database (or let Prisma do it)
```

## Data Validation Rules

### Business Constraints (Enforced in Code)

- Hackathon owner cannot create teams in own hackathon
- Max teams limit enforced at team creation
- Team size limit enforced at join
- Structural changes only in DRAFT status
- Lifecycle state machine enforced
- UNIVERSITY_ONLY requires `allowedUniversities` array

### Database Constraints (Enforced in Schema)

- Unique slugs for hackathons and festivals
- Unique email for users
- Unique (userId, teamId) for team members
- Unique (hackathonId, order) for rounds
- Unique (formId, order) for registration fields
- Unique (hackathonId, userId, role) for user roles
- Foreign key cascade deletes

## Performance Tips

### Query Optimization

```typescript
// BAD: N+1 query problem
const hackathons = await prisma.hackathonEntity.findMany();
for (const h of hackathons) {
  const rounds = await prisma.roundEntity.findMany({
    where: { hackathonId: h.id },
  });
}

// GOOD: Use include
const hackathons = await prisma.hackathonEntity.findMany({
  include: { rounds: true },
});
```

### Pagination

```typescript
// For large datasets
const hackathons = await prisma.hackathonEntity.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: "desc" },
});
```

### Counting

```typescript
// For total count with pagination
const [hackathons, total] = await prisma.$transaction([
  prisma.hackathonEntity.findMany({ take: 20, skip: 0 }),
  prisma.hackathonEntity.count(),
]);
```

## Backup & Recovery

### Local Backup

```bash
docker exec oppskills-postgres pg_dump -U oppskills oppskills > backup.sql
```

### Restore Backup

```bash
docker exec -i oppskills-postgres psql -U oppskills oppskills < backup.sql
```

### Production Backup

- Use AWS RDS automated backups
- Point-in-time recovery (PITR)
- Manual snapshots before major changes
