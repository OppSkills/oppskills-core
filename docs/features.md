# OppSkills Platform Features Documentation

This document provides a comprehensive overview of all key features and business logic in the OppSkills platform.

---

## Table of Contents

1. [Hackathon Lifecycle Management](#1-hackathon-lifecycle-management)
2. [Role-Based Access Control](#2-role-based-access-control)
3. [Team Management](#3-team-management)
4. [Registration Forms](#4-registration-forms)
5. [Round Management](#5-round-management)
6. [Prize Management](#6-prize-management)
7. [Festival Hierarchy](#7-festival-hierarchy)
8. [File Uploads (S3 Presigned URLs)](#8-file-uploads-s3-presigned-urls)
9. [Visibility Control](#9-visibility-control)
10. [Business Rules and Constraints](#10-business-rules-and-constraints)

---

## 1. Hackathon Lifecycle Management

### Overview

Hackathons follow a strict lifecycle with well-defined states and transition rules enforced at the business logic layer.

### Lifecycle States

| State         | Description                                      | User Actions Allowed                                                 |
| ------------- | ------------------------------------------------ | -------------------------------------------------------------------- |
| **DRAFT**     | Initial state when creating a hackathon          | Edit all fields, add rounds, update prizes, update registration form |
| **PUBLISHED** | Hackathon is visible and accepting registrations | View, register, no edits allowed                                     |
| **ONGOING**   | Event is currently happening                     | View only                                                            |
| **COMPLETED** | Event has finished                               | View only (terminal state)                                           |
| **CANCELLED** | Event was cancelled                              | View only (terminal state)                                           |

### State Transitions

Valid transitions are strictly enforced:

```
DRAFT → PUBLISHED → ONGOING → COMPLETED
  ↓         ↓          ↓
CANCELLED CANCELLED CANCELLED
```

**Allowed Transitions:**

- `DRAFT` can transition to: `PUBLISHED`, `CANCELLED`
- `PUBLISHED` can transition to: `ONGOING`, `CANCELLED`
- `ONGOING` can transition to: `COMPLETED`, `CANCELLED`
- `COMPLETED` is terminal (no transitions)
- `CANCELLED` is terminal (no transitions)

### Key Constraints

1. **Edit Restrictions**: Hackathons can only be edited when status is `DRAFT`
2. **Terminal States**: Once `COMPLETED` or `CANCELLED`, no status changes are allowed
3. **Permission Required**: Only owner, admin, or manager can change hackathon status
4. **Auto-generation**: If no rounds are provided during creation, 3 default rounds are automatically generated with evenly split timelines

### Implementation Details

**Service:** `HackathonService`
**Methods:**

- `createHackathon()` - Creates hackathon in DRAFT state
- `updateHackathonStatus()` - Changes lifecycle status with validation
- `assertLifecycleTransitionAllowed()` - Validates state transitions

**Database Schema:**

```prisma
enum LifecycleStatus {
  DRAFT
  PUBLISHED
  ONGOING
  COMPLETED
  CANCELLED
}

model HackathonEntity {
  status LifecycleStatus @default(DRAFT)
  // ... other fields
}
```

---

## 2. Role-Based Access Control

### Overview

The platform implements a multi-layered authorization system with global access levels and per-hackathon roles.

### Global Access Levels

Defined in the `AccessLevel` enum:

| Level      | Permissions                                                   | Use Case              |
| ---------- | ------------------------------------------------------------- | --------------------- |
| **ADMIN**  | Full system access, can edit/delete any hackathon or festival | System administrators |
| **USER**   | Can create and manage own hackathons/festivals                | Default for all users |
| **VIEWER** | Read-only access                                              | Future use            |

Admin users are configured via the `ADMIN_USER_IDS` environment variable (comma-separated Clerk user IDs).

### Per-Hackathon Roles

Hackathon owners can assign additional roles to users:

| Role          | Permissions                                     | Management                         |
| ------------- | ----------------------------------------------- | ---------------------------------- |
| **OWNER**     | Full control (edit, delete, manage roles)       | Set at creation, cannot be changed |
| **MANAGER**   | Can edit hackathon (when DRAFT), view dashboard | Added/removed by owner or admin    |
| **EVALUATOR** | Reserved for future evaluation features         | Added/removed by owner or admin    |

### Role Assignment

**Adding Roles:**

- Only owner or admin can add managers/evaluators
- Users are identified by email address
- Email lookup is case-insensitive
- Cannot assign role to hackathon owner (they already have full access)
- Idempotent operation (adding existing role returns success)

**Removing Roles:**

- Only owner or admin can remove managers/evaluators
- Identified by email address
- Returns error if user doesn't have the specified role

### Dashboard Visibility

The `listMyHackathons()` method returns hackathons where the user is:

- The owner, OR
- A manager

Evaluators are intentionally excluded from dashboard listing (future feature).

### Permission Checking

**Edit Permissions:**

```typescript
// User can edit if:
// 1. They are the owner, OR
// 2. They are an admin, OR
// 3. They are a manager (for the specific hackathon)
```

**Delete Permissions:**

```typescript
// User can delete if:
// 1. They are the owner, OR
// 2. They are an admin
```

### Implementation Details

**Service:** `HackathonService`
**Methods:**

- `getHackathonRoles()` - Get all roles for a hackathon (owner + managers + evaluators)
- `addHackathonRole()` - Add a manager or evaluator
- `removeHackathonRole()` - Remove a manager or evaluator
- `isHackathonManager()` - Check if user is a manager
- `isAdminUser()` - Check if user has ADMIN access level

**Database Schema:**

```prisma
model HackathonUserRoleEntity {
  id          String
  hackathonId String
  userId      String
  role        HackathonUserRole  // MANAGER or EVALUATOR
  createdById String?

  @@unique([hackathonId, userId, role])
}

enum HackathonUserRole {
  MANAGER
  EVALUATOR
}
```

---

## 3. Team Management

### Overview

Teams allow multiple participants to collaborate in a hackathon. The platform enforces team size limits and prevents conflicts.

### Team Creation

**Process:**

1. User creates a team for a specific hackathon
2. Creator becomes the team leader
3. Team has a maximum size defined by the organizer

**Business Rules:**

- Hackathon must exist
- Hackathon owner cannot create a team in their own hackathon
- If hackathon has `maxTeams` limit, enforce it (null = unlimited)
- Team cannot exceed the team size limit defined in `participantType`

### Team Size Configuration

Team size is configured via the `participantType` field:

```prisma
enum ParticipantType {
  INDIVIDUAL        // 1 person
  TEAM_OF_2         // 2 people
  TEAM_OF_3         // 3 people
  TEAM_OF_4         // 4 people
  TEAM_OF_5         // 5 people
  TEAM_OF_6         // 6 people
  MORE_THAN_6       // Custom team size
}
```

### Joining Teams

**Process:**

1. User requests to join an existing team
2. System validates eligibility
3. User is added as a team member

**Business Rules:**

- Team must exist
- Team must not be full (`members.length < maxSize`)
- Team leader cannot join their own team
- User cannot join same team twice
- User must not be the hackathon owner

### Leaving Teams

**Process:**

1. Team member requests to leave
2. System removes membership
3. Team size is reduced

**Business Rules:**

- User must be a member of the team
- Team leader cannot leave via this method (would need to delete team)

### Maximum Teams Limit

Hackathon organizers can limit total number of teams:

- Set via `maxTeams` field on hackathon
- `null` = unlimited teams
- When limit is reached, new team creation is blocked
- Can be updated while hackathon is in DRAFT status

### Implementation Details

**Service:** `TeamService`
**Methods:**

- `createTeam()` - Create a new team with leader
- `joinTeam()` - Add user as team member
- `leaveTeam()` - Remove user from team
- `getTeamsByHackathon()` - List all teams for a hackathon
- `getTeamById()` - Get team details with members

**Database Schema:**

```prisma
model TeamEntity {
  id          String
  name        String
  maxSize     Int        // Team size limit
  hackathonId String
  leaderId    String
  members     TeamMemberEntity[]
}

model TeamMemberEntity {
  id       String
  userId   String
  teamId   String
  joinedAt DateTime

  @@unique([userId, teamId])  // Prevent duplicate membership
}
```

---

## 4. Registration Forms

### Overview

Hackathons can have custom registration forms with flexible field types, or use external form links.

### Registration Form Options

**Option 1: Internal Custom Form**

- Create custom fields with various types
- Full control over field configuration
- Data collected within the platform

**Option 2: External Form Link**

- Provide URL to external form (Google Forms, Typeform, etc.)
- When external link is set, internal fields are cleared
- Simpler for organizers already using external tools

### Field Types

```prisma
enum RegistrationFieldType {
  TEXT         // Single-line text input
  PHONE_NO     // Phone number with validation
  EMAIL        // Email address with validation
  NUMBER       // Numeric input
  ATTACHMENTS  // File upload field
  OPTIONS      // Multiple choice (dropdown/radio)
}
```

### Field Configuration

Each field supports:

| Property      | Type                  | Description                             |
| ------------- | --------------------- | --------------------------------------- |
| `label`       | String                | Field label/question                    |
| `type`        | RegistrationFieldType | Input type                              |
| `required`    | Boolean               | Whether field is mandatory              |
| `order`       | Integer               | Display order (must be unique per form) |
| `options`     | String[]              | Choices for OPTIONS type                |
| `placeholder` | String?               | Placeholder text                        |

### Form Management

**Creating/Updating Form:**

- Only available when hackathon is in DRAFT status
- Can be updated via dedicated endpoint: `PUT /hackathons/:id/registration-form`
- Form replacement is atomic (delete old fields, create new ones in transaction)

**Validation Rules:**

- Field order values must be unique within a form
- If external form link is provided, internal fields are automatically cleared
- Empty fields array clears all custom fields

### Form Storage

**Database Schema:**

```prisma
model RegistrationFormEntity {
  id               String
  externalFormLink String?  // If set, use external form
  hackathonId      String   @unique  // One form per hackathon
  fields           RegistrationFieldEntity[]
}

model RegistrationFieldEntity {
  id                 String
  registrationFormId String
  label              String
  type               RegistrationFieldType
  required           Boolean
  order              Int      // Must be unique per form
  options            String[]
  placeholder        String?

  @@unique([registrationFormId, order])
}
```

### Implementation Details

**Service:** `HackathonService`
**Method:** `updateHackathonRegistrationForm()`

**Workflow:**

1. Validate hackathon is editable (DRAFT status, proper permissions)
2. Validate field order uniqueness
3. Upsert registration form
4. Delete all existing fields
5. If internal form (no external link), create new fields

---

## 5. Round Management

### Overview

Hackathons are divided into rounds, each with specific timelines, types, and submission configurations.

### Round Types

```prisma
enum HackathonRoundType {
  ONLINE       // Virtual participation, online submissions
  OFFLINE      // In-person participation
  PRESENTATION // Final presentation/demo round
}
```

Different round types may require different submission configurations.

### Round Configuration

Each round includes:

| Field              | Type               | Description                                  |
| ------------------ | ------------------ | -------------------------------------------- |
| `name`             | String             | Round name (e.g., "Round 1", "Finals")       |
| `description`      | String?            | Optional description                         |
| `startsAt`         | DateTime           | When round begins                            |
| `endsAt`           | DateTime           | When round ends                              |
| `order`            | Integer            | Display order (must be unique per hackathon) |
| `roundType`        | HackathonRoundType | Type of round                                |
| `submissionConfig` | JSON?              | Custom submission requirements               |

### Round Status

Tracks the current state of each round:

```prisma
enum RoundStatus {
  UPCOMING   // Round hasn't started yet
  ONGOING    // Round is currently active
  COMPLETED  // Round has finished
}
```

Status can be updated based on current time and round dates.

### Default Round Generation

When creating a hackathon without specifying rounds:

1. System generates 3 default rounds
2. Timeline is evenly split between hackathon start and end dates
3. Rounds are named "Round 1", "Round 2", "Round 3"
4. Default round type is `ONLINE`
5. Each round gets sequential order: 0, 1, 2

**Calculation:**

```typescript
totalDuration = endDate - startDate
roundDuration = totalDuration / 3

Round 1: startDate → startDate + roundDuration
Round 2: startDate + roundDuration → startDate + (2 * roundDuration)
Round 3: startDate + (2 * roundDuration) → endDate
```

### Round Management

**Updating Rounds:**

- Only when hackathon is in DRAFT status
- Dedicated endpoint: `PUT /hackathons/:id/rounds`
- Full replacement (delete all existing rounds, create new ones)
- Transaction-based for data consistency

**Validation:**

- Each round's `endsAt` must be >= `startsAt`
- Order values should be unique (enforced by DB)

### Submission Configuration

The `submissionConfig` JSON field allows flexible configuration per round. Example structure:

```json
{
  "allowedFileTypes": ["pdf", "zip", "mp4"],
  "maxFileSize": 52428800,
  "requiresGithubLink": true,
  "requiresVideoDemo": false,
  "customFields": [
    {
      "label": "Project Title",
      "required": true
    }
  ]
}
```

Schema is flexible to accommodate different hackathon types.

### Implementation Details

**Service:** `HackathonService`
**Methods:**

- `updateHackathonRounds()` - Replace all rounds
- `generateDefaultRounds()` - Create default 3-round structure

**Database Schema:**

```prisma
model RoundEntity {
  id               String
  hackathonId      String
  name             String
  description      String?
  startsAt         DateTime
  endsAt           DateTime
  order            Int
  status           RoundStatus @default(UPCOMING)
  roundType        HackathonRoundType
  submissionConfig Json?

  @@unique([hackathonId, order])
}
```

---

## 6. Prize Management

### Overview

Hackathons can define prizes with flexible structures supporting multiple winners and prize tiers.

### Prize Configuration

**Prize Total Worth:**

- `prizeTotalWorthAmount` - Overall prize pool amount
- `currency` - Currency code (default: "INR")
- Displayed as aggregate prize pool

**Prize Breakdown:**

- Detailed breakdown by position/tier
- Multiple winners supported
- Each entry includes amount and description

### Prize Breakdown Structure

Each prize entry contains:

| Field         | Type    | Description                                      |
| ------------- | ------- | ------------------------------------------------ |
| `position`    | String  | Prize tier (e.g., "1st Place", "Best Design")    |
| `amount`      | Decimal | Prize amount (up to 12 digits, 2 decimal places) |
| `description` | String? | Additional prize details                         |

**Example:**

```json
[
  {
    "position": "1st Place",
    "amount": "50000.00",
    "description": "Cash prize + mentorship"
  },
  {
    "position": "2nd Place",
    "amount": "30000.00",
    "description": "Cash prize"
  },
  {
    "position": "Best Innovation",
    "amount": "10000.00",
    "description": "Special category award"
  }
]
```

### Additional Prize Features

**Prize Description (JSON):**

- `prizeDescription` - Rich JSON field for detailed prize information
- Can include structured data like perks, sponsorships, etc.

**Certificate:**

- `prizeCertificate` - Boolean flag
- Indicates if winners receive certificates
- Default: false

### Prize Management

**Updating Prizes:**

- Only when hackathon is in DRAFT status
- Dedicated endpoint: `PUT /hackathons/:id/prize-breakdown`
- Full replacement of prize list
- Transaction-based update

**Validation:**

- All amounts must be valid finite numbers
- Amounts are stored as Decimal(12,2) for precision
- Empty array clears all prize breakdowns

### Implementation Details

**Service:** `HackathonService`
**Method:** `updateHackathonPrizeBreakdown()`

**Database Schema:**

```prisma
model HackathonEntity {
  prizeTotalWorthAmount Decimal?  @db.Decimal(12, 2)
  currency              String    @default("INR")
  prizeDescription      Json?
  prizeCertificate      Boolean   @default(false)
  prizeBreakdown        PrizeBreakdownEntity[]
}

model PrizeBreakdownEntity {
  id          String
  hackathonId String
  position    String     // Prize tier/position
  amount      Decimal    @db.Decimal(12, 2)
  description String?
}
```

---

## 7. Festival Hierarchy

### Overview

Festivals are top-level events that can contain multiple hackathons, enabling organizers to run multi-event conferences or competitions.

### Hierarchy Structure

```
Festival (e.g., "TechFest 2025")
├── Hackathon 1 (e.g., "AI Challenge")
├── Hackathon 2 (e.g., "Web Dev Sprint")
└── Hackathon 3 (e.g., "Mobile App Contest")
```

### Festival Features

**Core Information:**

- Name, description, slug (URL-friendly identifier)
- Poster image URL
- Website URL
- Start and end dates

**Location:**

- Same location system as hackathons
- Can be PHYSICAL or VIRTUAL
- Shared location information across all hackathons (optional)

**Organization:**

- Organizer ID (festival creator)
- Organization name and logo
- Multiple hackathons under single organization

**Lifecycle:**

- Same lifecycle states as hackathons (DRAFT → PUBLISHED → ONGOING → COMPLETED)
- Same transition rules and terminal states
- Managed independently from child hackathons

### Hackathon-Festival Relationship

**Standalone Hackathons:**

- `festivalId` is null
- Independent event
- Most common use case

**Festival Hackathons:**

- `festivalId` references parent festival
- Can inherit festival organization info
- Listed under festival
- Deletion: When festival is deleted, hackathons' `festivalId` is set to null (not cascade deleted)

**Querying:**

- List all festivals: `GET /festivals`
- List hackathons under festival: `GET /festivals/:id/hackathons`
- List hackathons with optional festival filter: `GET /hackathons?festivalId=xxx`

### Festival Management

**Creation:**

- Any authenticated user can create a festival
- Creator becomes the organizer
- Starts in DRAFT status

**Permissions:**

- Organizer can edit/delete festival
- Admin users can edit/delete any festival
- Same permission model as hackathons

**Slug Generation:**

- Auto-generated from name or custom slug
- Unique constraint enforced
- Collision resolution via random suffix

### Use Cases

1. **Tech Conference:** Festival containing multiple tracks/hackathons
2. **University Event:** Annual fest with multiple competitions
3. **Corporate Challenge:** Company-wide innovation events
4. **Multi-day Festival:** Different hackathons for different days/themes

### Implementation Details

**Service:** `FestivalService`
**Methods:**

- `createFestival()` - Create new festival
- `updateFestival()` - Update festival details
- `deleteFestival()` - Delete festival (sets hackathons' festivalId to null)
- `updateFestivalStatus()` - Change lifecycle status
- `getHackathonsUnderFestival()` - List child hackathons

**Database Schema:**

```prisma
model FestivalEntity {
  id                  String
  slug                String          @unique
  name                String
  description         String?
  posterImageUrl      String?
  websiteUrl          String?

  // Location
  locationType        LocationType?
  locationAddress     String?
  locationCoords        String?
  locationVirtualLink String?

  // Dates
  startDate           DateTime
  endDate             DateTime

  // Organization
  organizerId         String?
  organizationName    String?
  organizationLogoUrl String?

  // Lifecycle
  status              LifecycleStatus @default(DRAFT)

  // Relations
  hackathons          HackathonEntity[]
}

model HackathonEntity {
  festivalId String?
  festival   FestivalEntity? @relation(fields: [festivalId], references: [id], onDelete: SetNull)
}
```

---

## 8. File Uploads (S3 Presigned URLs)

### Overview

The platform uses S3 presigned POST URLs for secure, direct client-to-S3 uploads, eliminating the need to proxy large files through the backend.

### Upload Flow

1. **Client requests presigned URL** from backend
2. **Backend generates presigned POST** with policy and signature
3. **Client uploads directly to S3** using the presigned URL
4. **Client receives public URL** and stores it in the database

### Supported File Types

**Images:**

- JPEG (`image/jpeg`)
- PNG (`image/png`)
- WebP (`image/webp`)
- Max size: 10MB (configurable via `MEDIA_MAX_UPLOAD_BYTES`)

**Documents:**

- PDF (`application/pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft Excel (`.xls`, `.xlsx`)
- Microsoft PowerPoint (`.ppt`, `.pptx`)
- Plain text (`.txt`)
- Images (JPEG, PNG for attachments)
- Max size: 100MB (configurable via `MEDIA_MAX_DOCUMENT_UPLOAD_BYTES`)

### Upload Purposes

**Image Uploads:**

- `HACKATHON_BANNER` - Banner images for hackathons

**Document Uploads:**

- `EVENT_ATTACHMENT` - Documents attached to hackathons
- `OPPORTUNITY_ATTACHMENT` - Documents for other opportunities

### Presigned URL Structure

**Response Format:**

```json
{
  "uploadUrl": "https://oppskills-media.s3.amazonaws.com",
  "fields": {
    "key": "public/hackathon-banners/user_xyz/uuid-123.jpg",
    "Content-Type": "image/jpeg",
    "policy": "eyJleHBpcmF0aW9uIj...",
    "x-amz-algorithm": "AWS4-HMAC-SHA256",
    "x-amz-credential": "...",
    "x-amz-date": "20250120T120000Z",
    "x-amz-signature": "...",
    "success_action_status": "201"
  },
  "key": "public/hackathon-banners/user_xyz/uuid-123.jpg",
  "publicUrl": "https://cdn.oppskills.com/public/hackathon-banners/user_xyz/uuid-123.jpg",
  "maxBytes": 10485760
}
```

**Client Upload Process:**

```javascript
// 1. Get presigned URL from backend
const response = await fetch("/media/presign-image", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    purpose: "HACKATHON_BANNER",
    mimeType: "image/jpeg",
  }),
});

const { uploadUrl, fields, publicUrl } = await response.json();

// 2. Upload to S3
const formData = new FormData();
Object.entries(fields).forEach(([key, value]) => {
  formData.append(key, value);
});
formData.append("file", imageFile);

await fetch(uploadUrl, {
  method: "POST",
  body: formData,
});

// 3. Store publicUrl in database
await fetch("/hackathons/123", {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    bannerImageUrl: publicUrl,
  }),
});
```

### Object Key Structure

**Images:**

```
public/hackathon-banners/{encodedUserId}/{uuid}.{ext}
```

**Documents:**

```
public/event-attachments/{encodedUserId}/{sanitizedFileName}-{uuid}.{ext}
public/opportunity-attachments/{encodedUserId}/{sanitizedFileName}-{uuid}.{ext}
```

**Key Features:**

- UUID ensures uniqueness
- User ID for organization/access control
- Sanitized filenames (alphanumeric, dash, underscore only)
- Max 50 character filename length

### Security & Validation

**Presigned POST Constraints:**

- Expires after 60 seconds
- Content-Length-Range enforced (1 byte to maxBytes)
- Content-Type must match exactly
- Success action status 201 (returns metadata on success)

**Backend Validation:**

- MIME type allowlist checked
- File size limits enforced
- User authentication required
- Invalid MIME types rejected with 400

### CDN & Public URLs

**CloudFront Distribution:**

- Backend generates public URLs with CloudFront domain
- Configured via `MEDIA_CLOUDFRONT_BASE_URL` env var
- Provides global CDN for fast access
- URL format: `{cloudfrontBase}/{objectKey}`

### Attachment Management

**Hackathon Attachments:**

- Stored in `HackathonAttachmentEntity` table
- Tracks storage key, public URL, filename, MIME type, size
- Can be bulk replaced via `PUT /hackathons/:id/additional-info`
- Cascade deleted when hackathon is deleted

**Attachment Structure:**

```prisma
model HackathonAttachmentEntity {
  id          String
  hackathonId String
  storageKey  String   // S3 object key
  publicUrl   String?  // CDN URL
  fileName    String?  // Original filename
  mimeType    String?  // MIME type
  sizeBytes   Int?     // File size
}
```

### Environment Configuration

**Required Variables:**

- `MEDIA_S3_BUCKET` - S3 bucket name
- `MEDIA_CLOUDFRONT_BASE_URL` - CloudFront distribution URL
- `AWS_REGION` - AWS region (default: us-east-1)

**Optional Variables:**

- `MEDIA_MAX_UPLOAD_BYTES` - Image max size (default: 10MB)
- `MEDIA_MAX_DOCUMENT_UPLOAD_BYTES` - Document max size (default: 100MB)
- `MEDIA_ALLOWED_IMAGE_MIME_TYPES` - Comma-separated image MIME types
- `MEDIA_ALLOWED_DOCUMENT_MIME_TYPES` - Comma-separated document MIME types

### Implementation Details

**Service:** `MediaService`
**Methods:**

- `presignImageUpload()` - Generate presigned POST for images
- `presignDocumentUpload()` - Generate presigned POST for documents

**Controller:** `MediaController`
**Endpoints:**

- `POST /media/presign-image` - Request image upload URL
- `POST /media/presign-document` - Request document upload URL

---

## 9. Visibility Control

### Overview

Hackathons support three visibility levels to control who can view and register for events.

### Visibility Levels

```prisma
enum Visibility {
  PUBLIC           // Anyone can view and register
  PRIVATE          // Invitation only
  UNIVERSITY_ONLY  // Restricted to specific universities
}
```

### PUBLIC Visibility

**Characteristics:**

- Default visibility level
- Anyone can view the hackathon
- Open registration (subject to team limits)
- Listed in public hackathon directories
- No restrictions on who can participate

**Use Cases:**

- Public hackathons
- Open competitions
- Community events

### PRIVATE Visibility

**Characteristics:**

- Invitation-only access
- Not listed in public directories
- Registration requires special access/code
- Controlled participant list

**Use Cases:**

- Internal company hackathons
- Invite-only events
- Closed beta competitions
- VIP events

**Future Implementation:**

- Invitation code system
- Allowlist of participant emails
- Access token requirement

### UNIVERSITY_ONLY Visibility

**Characteristics:**

- Restricted to students from specific universities
- Requires `allowedUniversities` array to be populated
- Verification of university affiliation (future)
- Can be multiple universities

**Validation:**
When visibility is set to `UNIVERSITY_ONLY`:

```typescript
if (visibility === "UNIVERSITY_ONLY" && allowedUniversities.length === 0) {
  throw new BadRequestException(
    "allowedUniversities must be provided when visibility is UNIVERSITY_ONLY.",
  );
}
```

**Use Cases:**

- Inter-university competitions
- University-specific events
- Educational hackathons
- Student-only challenges

**Example:**

```json
{
  "visibility": "UNIVERSITY_ONLY",
  "allowedUniversities": [
    "Massachusetts Institute of Technology",
    "Stanford University",
    "Indian Institute of Technology Delhi"
  ]
}
```

### Attendee Eligibility

Separate from visibility, hackathons can specify attendee eligibility criteria:

```prisma
enum HackathonAttendeeEligibility {
  EVERYONE_CAN_APPLY
  SCHOOL_STUDENTS
  COLLEGE_STUDENTS
  FRESHERS
  PROFESSIONALS
}
```

This is a multi-select field allowing combinations like:

```json
{
  "attendeeEligibility": ["COLLEGE_STUDENTS", "FRESHERS"]
}
```

Default: `["EVERYONE_CAN_APPLY"]`

### Implementation Details

**Validation:** `HackathonService.assertUniversityRestrictionValid()`

**Database Schema:**

```prisma
model HackathonEntity {
  visibility          Visibility @default(PUBLIC)
  allowedUniversities String[]   @default([])
  attendeeEligibility HackathonAttendeeEligibility[] @default([])
}
```

---

## 10. Business Rules and Constraints

### Overview

The platform enforces numerous business rules to maintain data integrity and prevent invalid states.

### Date and Time Constraints

**Hackathon Dates:**

- `endDate` must be >= `startDate`
- Validated at creation and update
- Both dates are required

**Round Dates:**

- Each round's `endsAt` must be >= `startsAt`
- Rounds should fit within hackathon timeline (not enforced, allows flexibility)

**Registration Deadline:**

- Optional field
- Should be before hackathon `startDate` (recommended, not enforced)
- After deadline, registration should be closed (future implementation)

### Location Validation

**PHYSICAL Location:**

```typescript
// Required fields:
- locationType: 'PHYSICAL'
- locationAddress: non-empty string
// Optional:
- locationCoords: string
```

**VIRTUAL Location:**

```typescript
// Required fields:
- locationType: 'VIRTUAL'
- locationVirtualLink: non-empty string (meeting URL)
```

**Validation Logic:**

- Enforced at hackathon and festival creation/update
- Missing required fields throw `BadRequestException`

### Pricing Constraints

**Free Events:**

```typescript
isFree: true;
// No entry fee required
```

**Paid Events:**

```typescript
isFree: false
entryFeeAmount: required, non-empty string
currency: default "INR"
```

**Validation:**
When `isFree` is false, `entryFeeAmount` must be provided.

### Ownership and Permission Rules

**Hackathon Owner Restrictions:**

- Cannot create a team in their own hackathon
- Cannot register for their own hackathon
- Cannot be assigned as manager/evaluator (already has full access)

**Edit Restrictions:**

- Only editable in DRAFT status
- Nested updates (rounds, prizes, forms) require dedicated endpoints
- Main update endpoint blocks nested updates

### Team Constraints

**Team Creation:**

- Leader cannot be hackathon owner
- Must respect `maxTeams` limit (if set)
- Team size must match hackathon `participantType`

**Team Membership:**

- User cannot join team twice (enforced by DB unique constraint)
- Team cannot exceed `maxSize`
- Leader cannot join their own team

### Slug Generation

**Uniqueness:**

- Hackathon and festival slugs must be unique
- Auto-generated from name or custom slug
- Collision resolution via 6-character random suffix

**Format:**

- Lowercase
- Alphanumeric and hyphens only
- Leading/trailing hyphens removed
- Consecutive hyphens replaced with single hyphen

**Example:**

```
"My Awesome Hackathon 2025!"
  → "my-awesome-hackathon-2025"
  → (if exists) "my-awesome-hackathon-2025-a3x9z2"
```

### Field Uniqueness Constraints

**Registration Form:**

- Field `order` must be unique per form
- Enforced at validation and DB level

**Rounds:**

- Round `order` must be unique per hackathon
- Enforced by DB unique constraint

**Team Membership:**

- User can only join each team once
- Enforced by DB unique constraint `[userId, teamId]`

**Hackathon User Roles:**

- User can have each role only once per hackathon
- Enforced by DB unique constraint `[hackathonId, userId, role]`

### Data Integrity Rules

**Cascading Deletes:**

- Delete hackathon → cascade delete rounds, teams, attachments, roles
- Delete team → cascade delete team members
- Delete user → cascade delete their roles (but hackathons become ownerless - should set to null)

**Null Handling:**

- Delete festival → hackathon `festivalId` set to null (not cascade)
- Delete user → festival `organizerId` set to null

### Transaction Boundaries

**Atomic Operations:**
All these operations use database transactions:

- Round replacement
- Prize breakdown update
- Registration form update
- Additional info update (contact + attachments)

Ensures either all changes succeed or all are rolled back.

### Default Values

**Hackathon Defaults:**

```typescript
{
  status: 'DRAFT',
  visibility: 'PUBLIC',
  hackathonType: 'CODING_HACKATHON',
  participantType: 'INDIVIDUAL',
  isFree: true,
  currency: 'INR',
  prizeCertificate: false,
  attendeeEligibility: ['EVERYONE_CAN_APPLY'],
  maxTeams: null,  // unlimited
  allowedUniversities: [],
  impressions: 0,
  registrationCount: 0
}
```

**Round Defaults:**

```typescript
{
  status: 'UPCOMING',
  roundType: 'ONLINE',
  submissionConfig: null
}
```

**Registration Field Defaults:**

```typescript
{
  required: false,
  options: []
}
```

### Validation Summary

| Constraint              | Enforcement   | Error Type                     |
| ----------------------- | ------------- | ------------------------------ |
| Date ranges             | Service layer | BadRequestException            |
| Location fields         | Service layer | BadRequestException            |
| Pricing rules           | Service layer | BadRequestException            |
| University restrictions | Service layer | BadRequestException            |
| Slug uniqueness         | Service + DB  | ConflictException (P2002)      |
| Field order uniqueness  | Service + DB  | BadRequestException / DB error |
| Team size limits        | Service layer | ForbiddenException             |
| Team membership         | DB constraint | Unique violation               |
| Ownership restrictions  | Service layer | ForbiddenException             |
| Lifecycle transitions   | Service layer | ForbiddenException             |
| Permission checks       | Service layer | ForbiddenException             |

---

## Appendix: Quick Reference

### Enums Reference

**LifecycleStatus:** DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED

**Visibility:** PUBLIC, PRIVATE, UNIVERSITY_ONLY

**HackathonMode:** ONLINE, OFFLINE, HYBRID

**HackathonType:** CODING_HACKATHON, IDEA_HACKATHON, CASE_STUDY_COMPETITION, DESIGN_HACKATHON, OPEN_HACKATHON

**ParticipantType:** INDIVIDUAL, TEAM_OF_2, TEAM_OF_3, TEAM_OF_4, TEAM_OF_5, TEAM_OF_6, MORE_THAN_6

**LocationType:** PHYSICAL, VIRTUAL

**HackathonRoundType:** ONLINE, OFFLINE, PRESENTATION

**RoundStatus:** UPCOMING, ONGOING, COMPLETED

**RegistrationFieldType:** TEXT, PHONE_NO, EMAIL, NUMBER, ATTACHMENTS, OPTIONS

**HackathonAttendeeEligibility:** EVERYONE_CAN_APPLY, SCHOOL_STUDENTS, COLLEGE_STUDENTS, FRESHERS, PROFESSIONALS

**HackathonUserRole:** MANAGER, EVALUATOR

**AccessLevel:** ADMIN, USER, VIEWER

### Service Methods Quick Reference

**HackathonService:**

- CRUD: `createHackathon`, `listHackathons`, `getHackathonById`, `updateHackathon`, `deleteHackathon`
- Nested Updates: `updateHackathonRounds`, `updateHackathonPrizeBreakdown`, `updateHackathonRegistrationForm`, `updateHackathonAdditionalInfo`, `updateHackathonMaxTeams`
- Lifecycle: `updateHackathonStatus`
- Dashboard: `listMyHackathons`
- Roles: `getHackathonRoles`, `addHackathonRole`, `removeHackathonRole`

**FestivalService:**

- CRUD: `createFestival`, `listFestivals`, `getFestivalById`, `updateFestival`, `deleteFestival`
- Lifecycle: `updateFestivalStatus`
- Hierarchy: `getHackathonsUnderFestival`

**TeamService:**

- CRUD: `createTeam`, `getTeamsByHackathon`, `getTeamById`
- Membership: `joinTeam`, `leaveTeam`

**MediaService:**

- Uploads: `presignImageUpload`, `presignDocumentUpload`

---

## Document Metadata

**Version:** 1.0
**Last Updated:** 2025-12-20
**Maintainers:** OppSkills Platform Team
**Related Documentation:**

- `/CLAUDE.md` - Development guide
- `/packages/database/prisma/schema.prisma` - Database schema
- `/packages/types/src/enums/` - TypeScript type definitions
