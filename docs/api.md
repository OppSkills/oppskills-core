# OppSkills API Documentation

## Table of Contents
- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Common Patterns](#common-patterns)
- [Error Responses](#error-responses)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Hackathons](#hackathons)
  - [Events](#events)
  - [Festivals](#festivals)
  - [Teams](#teams)
  - [Media](#media)
  - [User Accounts](#user-accounts)

---

## Overview

The OppSkills API is a RESTful API built with NestJS that manages hackathons, festivals, teams, and related resources. The API uses JWT-based authentication via Clerk and follows standard HTTP conventions for methods, status codes, and error handling.

## Base URL

```
Development: http://localhost:3001
Production: [Your production URL]
```

The backend runs on port 3001 by default (configurable via `PORT` environment variable).

## Authentication

### Bearer Token Authentication

Most endpoints require authentication using Clerk JWT tokens. Include the token in the `Authorization` header:

```http
Authorization: Bearer <your-clerk-jwt-token>
```

### Development Auth Bypass (Non-Production Only)

When `AUTH_BYPASS=true` is set in development environments, you can bypass Clerk authentication by passing a user ID in the header:

```http
x-user-id: user_1234567890
```

**Security Note**: This bypass is automatically disabled in production environments.

### User Roles

The API supports three access levels:
- **ADMIN**: Full system access (configured via `ADMIN_USER_IDS` environment variable)
- **USER**: Standard user access (default)
- **VIEWER**: Read-only access

Additional hackathon-specific roles:
- **OWNER**: Creator of the hackathon
- **MANAGER**: Can manage hackathon settings and participants
- **EVALUATOR**: Can evaluate submissions (read-only for now)

---

## Common Patterns

### Lifecycle Status

Events (hackathons and festivals) follow a lifecycle status pattern:

```typescript
type LifecycleStatus =
  | "DRAFT"       // Being created, not publicly visible
  | "PUBLISHED"   // Public and accepting registrations
  | "ONGOING"     // Event is currently happening
  | "COMPLETED"   // Event has finished
  | "CANCELLED"   // Event was cancelled
```

### Visibility Control

Hackathons support three visibility levels:

```typescript
type Visibility =
  | "PUBLIC"          // Anyone can see and register
  | "PRIVATE"         // Invitation only
  | "UNIVERSITY_ONLY" // Restricted to allowedUniversities list
```

### Location Handling

Both festivals and hackathons use a location object:

```json
{
  "type": "PHYSICAL" | "VIRTUAL",
  "address": "456 Tech Park Ave, Building 3, Austin, TX 78701",
  "city": "Austin",
  "virtualLink": "https://meet.google.com/abc-defg-hij"
}
```

- For `PHYSICAL` type: `address` and `city` are typically provided
- For `VIRTUAL` type: `virtualLink` is required

### Pagination & Filtering

Currently, most list endpoints return all results. Future versions may implement pagination.

### Date Formats

All dates use ISO 8601 format:
```
2025-03-15T10:00:00Z
```

---

## Error Responses

The API uses standard HTTP status codes and returns errors in the following format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Missing or invalid authentication token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error - Server-side error |

---

## Endpoints

### Health Check

#### Get API Root
```http
GET /
```

**Response:**
```
welcome to oppskills-core backend
```

#### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

### Hackathons

#### Create Hackathon

Create a new hackathon in DRAFT status.

```http
POST /hackathons
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Tech Innovation Hackathon 2025",
  "slug": "tech-innovation-2025",
  "description": "Join us for an exciting hackathon focused on innovative solutions",
  "startDate": "2025-03-15T10:00:00Z",
  "endDate": "2025-03-17T18:00:00Z",
  "mode": "HYBRID",
  "visibility": "PUBLIC",
  "hackathonType": "CODING_HACKATHON",
  "participantType": "TEAM_OF_4",
  "bannerImageUrl": "https://cdn.oppskills.com/hackathons/tech-innovation-2025-banner.jpg",
  "festivalId": "550e8400-e29b-41d4-a716-446655440002",
  "location": {
    "type": "PHYSICAL",
    "address": "456 Tech Park Ave, Building 3, Austin, TX 78701",
    "city": "Austin"
  },
  "registrationDeadline": "2025-03-10T23:59:59Z",
  "isFree": true,
  "prizeTotalWorthAmount": "10000.00",
  "currency": "USD",
  "prizeBreakdown": [
    {
      "position": "1st Place",
      "amount": "5000.00",
      "description": "Grand prize winner"
    },
    {
      "position": "2nd Place",
      "amount": "3000.00",
      "description": "Runner-up"
    }
  ],
  "organizationName": "Tech Innovation Labs",
  "organizationLogoUrl": "https://cdn.oppskills.com/orgs/tech-innovation-labs-logo.svg",
  "attendeeEligibility": ["EVERYONE_CAN_APPLY"],
  "maxTeams": 50,
  "rounds": [
    {
      "name": "Round 1: Ideation",
      "description": "Submit your initial idea and project plan",
      "startsAt": "2025-03-15T10:00:00Z",
      "endsAt": "2025-03-15T18:00:00Z",
      "order": 0,
      "roundType": "ONLINE",
      "submissionConfig": {
        "requiresFileUpload": true,
        "allowedFileTypes": ["pdf", "pptx"],
        "maxFileSizeBytes": 10485760,
        "requiresDescription": true,
        "instructions": "Submit your project proposal"
      }
    }
  ],
  "additionalInfo": {
    "contact": {
      "name": "Jane Smith",
      "email": "jane.smith@techcorp.com",
      "phone": "+1-555-123-4567"
    },
    "attachments": [
      {
        "storageKey": "hackathons/2025/tech-innovation/rules.pdf",
        "publicUrl": "https://cdn.oppskills.com/hackathons/2025/tech-innovation/rules.pdf",
        "fileName": "hackathon-rules-2025.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 524288
      }
    ]
  }
}
```

**Response (201):**
```json
{
  "message": "Hackathon created successfully (DRAFT).",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tech Innovation Hackathon 2025",
    "slug": "tech-innovation-2025",
    "status": "DRAFT",
    "organizerId": "user_abc123",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Field Enums:**

- `mode`: `"ONLINE"` | `"OFFLINE"` | `"HYBRID"`
- `visibility`: `"PUBLIC"` | `"PRIVATE"` | `"UNIVERSITY_ONLY"`
- `hackathonType`: `"CODING_HACKATHON"` | `"IDEA_HACKATHON"` | `"CASE_STUDY_COMPETITION"` | `"DESIGN_HACKATHON"` | `"OPEN_HACKATHON"`
- `participantType`: `"INDIVIDUAL"` | `"TEAM_OF_2"` | `"TEAM_OF_3"` | `"TEAM_OF_4"` | `"TEAM_OF_5"` | `"TEAM_OF_6"` | `"MORE_THAN_6"`
- `attendeeEligibility`: `"EVERYONE_CAN_APPLY"` | `"SCHOOL_STUDENTS"` | `"COLLEGE_STUDENTS"` | `"FRESHERS"` | `"PROFESSIONALS"`
- `roundType`: `"ONLINE"` | `"OFFLINE"` | `"PRESENTATION"`

---

#### List All Hackathons

Retrieve a list of all hackathons, optionally filtered by festival.

```http
GET /hackathons?festival_id=<uuid>
Authorization: Bearer <token>
```

**Query Parameters:**
- `festival_id` (optional): Filter hackathons by festival ID

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tech Innovation Hackathon 2025",
    "slug": "tech-innovation-2025",
    "description": "Join us for an exciting hackathon",
    "status": "PUBLISHED",
    "mode": "HYBRID",
    "startDate": "2025-03-15T10:00:00Z",
    "endDate": "2025-03-17T18:00:00Z",
    "bannerImageUrl": "https://cdn.oppskills.com/hackathons/tech-innovation-2025-banner.jpg",
    "festivalId": null
  }
]
```

---

#### List My Hackathons

Retrieve hackathons where the authenticated user is the owner or a manager.

```http
GET /hackathons/my
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Tech Innovation Hackathon 2025",
    "slug": "tech-innovation-2025",
    "status": "PUBLISHED",
    "role": "OWNER"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "AI Challenge 2025",
    "slug": "ai-challenge-2025",
    "status": "ONGOING",
    "role": "MANAGER"
  }
]
```

---

#### Get Hackathon by ID

Retrieve detailed information about a specific hackathon.

```http
GET /hackathons/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Tech Innovation Hackathon 2025",
  "slug": "tech-innovation-2025",
  "description": "Join us for an exciting hackathon",
  "status": "PUBLISHED",
  "mode": "HYBRID",
  "visibility": "PUBLIC",
  "hackathonType": "CODING_HACKATHON",
  "participantType": "TEAM_OF_4",
  "startDate": "2025-03-15T10:00:00Z",
  "endDate": "2025-03-17T18:00:00Z",
  "registrationDeadline": "2025-03-10T23:59:59Z",
  "bannerImageUrl": "https://cdn.oppskills.com/hackathons/tech-innovation-2025-banner.jpg",
  "location": {
    "type": "PHYSICAL",
    "address": "456 Tech Park Ave, Building 3, Austin, TX 78701",
    "city": "Austin"
  },
  "rounds": [
    {
      "id": "round_123",
      "name": "Round 1: Ideation",
      "description": "Submit your initial idea",
      "startsAt": "2025-03-15T10:00:00Z",
      "endsAt": "2025-03-15T18:00:00Z",
      "order": 0,
      "roundType": "ONLINE"
    }
  ],
  "prizeBreakdown": [
    {
      "id": "prize_123",
      "position": "1st Place",
      "amount": "5000.00",
      "description": "Grand prize winner"
    }
  ],
  "registrationForm": {
    "externalFormLink": null,
    "fields": []
  },
  "additionalInfo": {
    "contact": {
      "name": "Jane Smith",
      "email": "jane.smith@techcorp.com",
      "phone": "+1-555-123-4567"
    },
    "attachments": []
  }
}
```

---

#### Get Hackathon by Slug

Retrieve hackathon information using its URL-friendly slug.

```http
GET /hackathons/by-slug/:slug
Authorization: Bearer <token>
```

**Example:**
```http
GET /hackathons/by-slug/tech-innovation-2025
```

**Response:** Same as "Get Hackathon by ID"

---

#### Update Hackathon

Update hackathon details. Only the owner can perform this action.

```http
PUT /hackathons/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Hackathon Name",
  "description": "Updated description",
  "festivalId": "550e8400-e29b-41d4-a716-446655440002",
  "startDate": "2025-03-20T10:00:00Z",
  "endDate": "2025-03-22T18:00:00Z",
  "bannerImageUrl": "https://cdn.oppskills.com/new-banner.jpg"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Hackathon Name",
  "status": "DRAFT",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not the owner
- `404 Not Found`: Hackathon not found

---

#### Update Hackathon Status

Change hackathon lifecycle status. Owner only.

```http
PATCH /hackathons/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "PUBLISHED"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PUBLISHED",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

---

#### Update Hackathon Rounds

Replace all rounds of a hackathon. Only allowed in DRAFT status. Owner only.

```http
PUT /hackathons/:id/rounds
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rounds": [
    {
      "name": "Round 1: Ideation",
      "description": "Submit your initial idea",
      "startsAt": "2025-03-15T10:00:00Z",
      "endsAt": "2025-03-15T18:00:00Z",
      "order": 0,
      "roundType": "ONLINE",
      "submissionConfig": {
        "requiresFileUpload": true,
        "allowedFileTypes": ["pdf", "pptx"],
        "maxFileSizeBytes": 10485760,
        "requiresDescription": true,
        "instructions": "Submit your project proposal"
      }
    },
    {
      "name": "Round 2: Development",
      "description": "Build your project",
      "startsAt": "2025-03-16T10:00:00Z",
      "endsAt": "2025-03-16T22:00:00Z",
      "order": 1,
      "roundType": "ONLINE"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Hackathon rounds updated successfully.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "rounds": [...]
  }
}
```

**Error Responses:**
- `403 Forbidden`: Not the owner or not in DRAFT status

---

#### Update Hackathon Additional Info

Update contact information and attachments. Only allowed in DRAFT status. Owner only.

```http
PUT /hackathons/:id/additional-info
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-987-6543"
  },
  "attachments": [
    {
      "storageKey": "hackathons/2025/tech-innovation/rules.pdf",
      "publicUrl": "https://cdn.oppskills.com/hackathons/2025/tech-innovation/rules.pdf",
      "fileName": "hackathon-rules-2025.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 524288
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Hackathon additional info updated successfully.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "additionalInfo": {...}
  }
}
```

---

#### Update Hackathon Registration Form

Replace the registration form. Only allowed in DRAFT status. Owner only.

```http
PUT /hackathons/:id/registration-form
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (External Form):**
```json
{
  "registrationForm": {
    "externalFormLink": "https://forms.google.com/hackathon-registration"
  }
}
```

**Request Body (Internal Form):**
```json
{
  "registrationForm": {
    "fields": [
      {
        "label": "University Name",
        "type": "TEXT",
        "required": true,
        "order": 0,
        "placeholder": "Enter your university name"
      },
      {
        "label": "Phone Number",
        "type": "PHONE_NO",
        "required": true,
        "order": 1,
        "placeholder": "+1-555-000-0000"
      },
      {
        "label": "T-Shirt Size",
        "type": "OPTIONS",
        "required": true,
        "order": 2,
        "options": ["S", "M", "L", "XL", "XXL"]
      }
    ]
  }
}
```

**Field Types:** `TEXT`, `PHONE_NO`, `EMAIL`, `NUMBER`, `ATTACHMENTS`, `OPTIONS`

**Response (200):**
```json
{
  "message": "Hackathon registration form updated successfully.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "registrationForm": {...}
  }
}
```

---

#### Update Hackathon Prize Breakdown

Replace the prize breakdown list. Only allowed in DRAFT status. Owner only.

```http
PUT /hackathons/:id/prize-breakdown
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "prizeBreakdown": [
    {
      "position": "1st Place",
      "amount": "5000.00",
      "description": "Grand prize winner"
    },
    {
      "position": "2nd Place",
      "amount": "3000.00",
      "description": "Runner-up"
    },
    {
      "position": "3rd Place",
      "amount": "2000.00",
      "description": "Third place"
    }
  ]
}
```

**Response (200):**
```json
{
  "message": "Hackathon prize breakdown updated successfully.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "prizeBreakdown": [...]
  }
}
```

---

#### Update Max Teams

Update the maximum number of teams allowed. Only allowed in DRAFT status. Owner only.

```http
PUT /hackathons/:id/max-teams
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "maxTeams": 100
}
```

Set to `null` for unlimited teams:
```json
{
  "maxTeams": null
}
```

**Response (200):**
```json
{
  "message": "Hackathon max teams updated successfully.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "maxTeams": 100
  }
}
```

---

#### Delete Hackathon

Delete a hackathon. Only the owner can perform this action.

```http
DELETE /hackathons/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Hackathon deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Not the owner
- `404 Not Found`: Hackathon not found

---

#### Register for Hackathon

Register the authenticated user for a hackathon.

```http
POST /hackathons/:id/register
Authorization: Bearer <token>
```

**Response (201):**
```json
{
  "message": "Successfully registered for hackathon",
  "registrationId": "reg_550e8400-e29b-41d4-a716-446655440000",
  "hackathonId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Responses:**
- `400 Bad Request`: Already registered or registration closed

---

#### Get Hackathon Roles

Retrieve all roles for a hackathon (owner, managers, evaluators).

```http
GET /hackathons/:id/roles
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "owner": {
    "id": "user_abc123",
    "email": "owner@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "imageUrl": "https://example.com/avatar.jpg"
  },
  "managers": [
    {
      "id": "user_def456",
      "email": "manager@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "imageUrl": "https://example.com/avatar2.jpg",
      "role": "MANAGER",
      "assignedAt": "2025-01-10T10:00:00Z"
    }
  ],
  "evaluators": [
    {
      "id": "user_ghi789",
      "email": "evaluator@example.com",
      "firstName": "Bob",
      "lastName": "Johnson",
      "imageUrl": "https://example.com/avatar3.jpg",
      "role": "EVALUATOR",
      "assignedAt": "2025-01-12T14:00:00Z"
    }
  ]
}
```

---

#### Add Hackathon Role

Add a manager or evaluator to a hackathon. Only the owner or admin can perform this action.

```http
POST /hackathons/:id/roles
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "manager@example.com",
  "role": "MANAGER"
}
```

**Roles:** `MANAGER` | `EVALUATOR`

**Response (201):**
```json
{
  "message": "Role MANAGER added successfully for user manager@example.com",
  "alreadyExists": false
}
```

**Error Responses:**
- `400 Bad Request`: User not found or invalid input
- `403 Forbidden`: Only owner or admin can add roles
- `404 Not Found`: Hackathon not found

---

#### Remove Hackathon Role

Remove a manager or evaluator from a hackathon. Only the owner or admin can perform this action.

```http
DELETE /hackathons/:id/roles
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "manager@example.com",
  "role": "MANAGER"
}
```

**Response (200):**
```json
{
  "message": "Role MANAGER removed successfully for user manager@example.com"
}
```

**Error Responses:**
- `403 Forbidden`: Only owner or admin can remove roles
- `404 Not Found`: Hackathon or role not found

---

### Events

Events are simpler than hackathons - they support individual user participation without teams or rounds.

#### Create Event

Create a new event in DRAFT status.

```http
POST /events
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Tech Meetup 2025",
  "slug": "tech-meetup-2025",
  "description": "Monthly tech community meetup",
  "startDate": "2025-03-15T18:00:00Z",
  "endDate": "2025-03-15T21:00:00Z",
  "location": {
    "type": "PHYSICAL",
    "address": "123 Tech Hub, San Francisco, CA",
    "city": "San Francisco"
  },
  "maxUsers": 100,
  "isFree": true,
  "organizationName": "Tech Community",
  "registrationDeadline": "2025-03-14T23:59:59Z"
}
```

**Response (201):**
```json
{
  "message": "Event created successfully (DRAFT).",
  "data": {
    "id": "clxx123abc",
    "name": "Tech Meetup 2025",
    "slug": "tech-meetup-2025",
    "status": "DRAFT",
    "ownerId": "user_abc123",
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

---

#### List All Events

Retrieve a list of all events, optionally filtered by festival.

```http
GET /events?festival_id=<uuid>
```

**Query Parameters:**
- `festival_id` (optional): Filter events by festival ID

**Response (200):**
```json
[
  {
    "id": "clxx123abc",
    "name": "Tech Meetup 2025",
    "slug": "tech-meetup-2025",
    "description": "Monthly tech community meetup",
    "status": "PUBLISHED",
    "startDate": "2025-03-15T18:00:00Z",
    "endDate": "2025-03-15T21:00:00Z",
    "registrationCount": 45,
    "maxUsers": 100
  }
]
```

---

#### List My Events

Retrieve events where the authenticated user is the owner or a manager.

```http
GET /events/my
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "clxx123abc",
    "name": "Tech Meetup 2025",
    "slug": "tech-meetup-2025",
    "status": "PUBLISHED",
    "role": "OWNER",
    "registrationCount": 45,
    "maxUsers": 100
  }
]
```

---

#### Get Event by ID

Retrieve detailed information about a specific event.

```http
GET /events/:id
```

**Response (200):**
```json
{
  "id": "clxx123abc",
  "name": "Tech Meetup 2025",
  "slug": "tech-meetup-2025",
  "description": "Monthly tech community meetup",
  "status": "PUBLISHED",
  "startDate": "2025-03-15T18:00:00Z",
  "endDate": "2025-03-15T21:00:00Z",
  "locationType": "PHYSICAL",
  "locationAddress": "123 Tech Hub, San Francisco, CA",
  "locationCity": "San Francisco",
  "maxUsers": 100,
  "registrationCount": 45,
  "isFree": true,
  "owner": {
    "id": "user_abc123",
    "email": "organizer@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "participants": [
    {
      "id": "participant_1",
      "user": {
        "id": "user_def456",
        "email": "participant@example.com",
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "joinedAt": "2025-01-10T15:30:00Z"
    }
  ]
}
```

---

#### Get Event by Slug

Retrieve event information using its URL-friendly slug.

```http
GET /events/by-slug/:slug
```

**Example:**
```http
GET /events/by-slug/tech-meetup-2025
```

**Response:** Same as "Get Event by ID"

---

#### Update Event

Update event details. Only the owner, admin, or manager can perform this action. Only allowed for DRAFT events.

```http
PUT /events/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Meetup Name",
  "description": "Updated description",
  "maxUsers": 150
}
```

**Response (200):** Updated event object

**Error Responses:**
- `403 Forbidden`: Not the owner/admin/manager or not in DRAFT status
- `404 Not Found`: Event not found

---

#### Update Event Status

Change event lifecycle status. Owner, admin, or manager only.

```http
PATCH /events/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "PUBLISHED"
}
```

**Response (200):**
```json
{
  "id": "clxx123abc",
  "status": "PUBLISHED",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

---

#### Delete Event

Delete an event. Only the owner or admin can perform this action.

```http
DELETE /events/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Event deleted successfully."
}
```

---

#### Join Event

Register the authenticated user for an event.

```http
POST /events/:id/join
Authorization: Bearer <token>
```

**Response (201):**
```json
{
  "message": "Successfully joined the event."
}
```

**Error Responses:**
- `400 Bad Request`: Event not accepting registrations, deadline passed, or at full capacity
- `409 Conflict`: Already joined

---

#### Leave Event

Remove the authenticated user's registration from an event.

```http
DELETE /events/:id/leave
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Successfully left the event."
}
```

**Error Responses:**
- `400 Bad Request`: Not a participant or event is completed/cancelled

---

#### Get Event Roles

Retrieve all roles for an event (owner, managers, evaluators).

```http
GET /events/:id/roles
```

**Response (200):**
```json
{
  "owner": {
    "id": "user_abc123",
    "email": "owner@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "imageUrl": "https://example.com/avatar.jpg"
  },
  "managers": [
    {
      "id": "user_def456",
      "email": "manager@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "imageUrl": null,
      "role": "MANAGER",
      "assignedAt": "2025-01-10T10:00:00Z"
    }
  ],
  "evaluators": []
}
```

---

#### Add Event Role

Assign a role to a user for an event. Owner or admin only.

```http
POST /events/:id/roles
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "manager@example.com",
  "role": "MANAGER"
}
```

**Response (201):**
```json
{
  "message": "Role MANAGER added successfully.",
  "user": {
    "id": "user_def456",
    "email": "manager@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "MANAGER"
  }
}
```

**Role Values:** `MANAGER`, `EVALUATOR`

**Error Responses:**
- `403 Forbidden`: Only owner or admin can assign roles
- `404 Not Found`: Event or user not found
- `409 Conflict`: User already has this role

---

#### Remove Event Role

Remove a role from a user for an event. Owner or admin only.

```http
DELETE /events/:id/roles
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "manager@example.com",
  "role": "MANAGER"
}
```

**Response (200):**
```json
{
  "message": "Role MANAGER removed successfully."
}
```

**Error Responses:**
- `403 Forbidden`: Only owner or admin can remove roles
- `404 Not Found`: Event or role not found

---

### Festivals

#### Create Festival

Create a new festival event.

```http
POST /festivals
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "TechFest 2025 - Innovation Conference",
  "slug": "tech-fest-2025",
  "description": "Join us for the largest tech innovation conference of 2025",
  "posterImageUrl": "https://cdn.oppskills.com/festivals/techfest-2025-poster.jpg",
  "websiteUrl": "https://techfest2025.com",
  "location": {
    "type": "PHYSICAL",
    "address": "123 Convention Center Dr, San Francisco, CA 94103",
    "city": "San Francisco"
  },
  "startDate": "2025-06-15T09:00:00Z",
  "endDate": "2025-06-18T18:00:00Z",
  "organizationName": "TechCorp International",
  "organizationLogoUrl": "https://cdn.oppskills.com/orgs/techcorp-logo.svg"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "TechFest 2025 - Innovation Conference",
  "slug": "tech-fest-2025",
  "status": "DRAFT",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

---

#### List All Festivals

Retrieve a list of all festivals.

```http
GET /festivals
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "TechFest 2025",
    "slug": "tech-fest-2025",
    "description": "Join us for the largest tech innovation conference",
    "status": "PUBLISHED",
    "startDate": "2025-06-15T09:00:00Z",
    "endDate": "2025-06-18T18:00:00Z",
    "posterImageUrl": "https://cdn.oppskills.com/festivals/techfest-2025-poster.jpg"
  }
]
```

---

#### List My Festivals

Retrieve festivals where the authenticated user is the owner or a manager.

```http
GET /festivals/my
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "TechFest 2025",
    "slug": "tech-fest-2025",
    "status": "PUBLISHED",
    "role": "OWNER"
  }
]
```

---

#### Get Festival by ID

Retrieve detailed information about a specific festival.

```http
GET /festivals/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "TechFest 2025",
  "slug": "tech-fest-2025",
  "description": "Join us for the largest tech innovation conference",
  "status": "PUBLISHED",
  "startDate": "2025-06-15T09:00:00Z",
  "endDate": "2025-06-18T18:00:00Z",
  "posterImageUrl": "https://cdn.oppskills.com/festivals/techfest-2025-poster.jpg",
  "websiteUrl": "https://techfest2025.com",
  "location": {
    "type": "PHYSICAL",
    "address": "123 Convention Center Dr, San Francisco, CA 94103",
    "city": "San Francisco"
  },
  "organizationName": "TechCorp International",
  "organizationLogoUrl": "https://cdn.oppskills.com/orgs/techcorp-logo.svg",
  "hackathons": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "AI Hackathon",
      "slug": "ai-hackathon"
    }
  ]
}
```

---

#### Update Festival

Update festival details. Only the owner can perform this action.

```http
PUT /festivals/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:** (All fields optional)
```json
{
  "name": "Updated Festival Name",
  "description": "Updated description",
  "startDate": "2025-06-20T09:00:00Z",
  "endDate": "2025-06-23T18:00:00Z"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "name": "Updated Festival Name",
  "status": "DRAFT",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

**Error Responses:**
- `403 Forbidden`: Not the owner
- `404 Not Found`: Festival not found

---

#### Update Festival Status

Change festival lifecycle status. Owner only.

```http
PATCH /festivals/:id/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "PUBLISHED"
}
```

**Status Values:** `DRAFT`, `PUBLISHED`, `ONGOING`, `COMPLETED`, `CANCELLED`

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "status": "PUBLISHED",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

---

#### Delete Festival

Delete a festival. Only the owner can perform this action.

```http
DELETE /festivals/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Festival deleted successfully"
}
```

**Error Responses:**
- `403 Forbidden`: Not the owner
- `404 Not Found`: Festival not found

---

#### Get Festival Hackathons

Retrieve all hackathons associated with a specific festival.

```http
GET /festivals/:id/hackathons
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "AI Hackathon",
    "slug": "ai-hackathon",
    "status": "PUBLISHED",
    "startDate": "2025-06-16T10:00:00Z",
    "endDate": "2025-06-17T18:00:00Z",
    "mode": "HYBRID"
  }
]
```

---

### Teams

#### Create Team

Create a new team for a hackathon. The authenticated user becomes the team leader.

```http
POST /hackathons/create-team
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Code Warriors",
  "hackathonId": "550e8400-e29b-41d4-a716-446655440000",
  "maxSize": 4
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Code Warriors",
  "hackathonId": "550e8400-e29b-41d4-a716-446655440000",
  "leaderId": "user_abc123",
  "maxSize": 4,
  "invitationCode": "ABC123",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input or team limit reached

---

#### Get Teams by Hackathon

Retrieve all teams for a specific hackathon.

```http
GET /hackathons/teams/:hackathonId
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Code Warriors",
    "leaderId": "user_abc123",
    "maxSize": 4,
    "currentSize": 3,
    "invitationCode": "ABC123",
    "members": [
      {
        "id": "member_001",
        "userId": "user_abc123",
        "role": "LEADER",
        "joinedAt": "2025-01-15T10:00:00Z"
      },
      {
        "id": "member_002",
        "userId": "user_def456",
        "role": "MEMBER",
        "joinedAt": "2025-01-15T11:00:00Z"
      }
    ]
  }
]
```

---

#### Get Team by ID

Retrieve detailed information about a specific team.

```http
GET /hackathons/team/:teamId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Code Warriors",
  "hackathonId": "550e8400-e29b-41d4-a716-446655440000",
  "leaderId": "user_abc123",
  "maxSize": 4,
  "invitationCode": "ABC123",
  "members": [
    {
      "id": "member_001",
      "userId": "user_abc123",
      "role": "LEADER",
      "joinedAt": "2025-01-15T10:00:00Z"
    },
    {
      "id": "member_002",
      "userId": "user_def456",
      "role": "MEMBER",
      "joinedAt": "2025-01-15T11:00:00Z"
    }
  ]
}
```

**Error Response:**
- `404 Not Found`: Team not found

---

#### Join Team

Join an existing team using team ID or invitation code.

```http
POST /hackathons/join-team
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "teamId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response (201):**
```json
{
  "message": "Successfully joined team",
  "teamId": "550e8400-e29b-41d4-a716-446655440001",
  "memberId": "member_003"
}
```

**Error Responses:**
- `400 Bad Request`: Team full or already a member
- `404 Not Found`: Team not found

---

#### Leave Team

Leave a team you are currently a member of.

```http
DELETE /hackathons/leave-team/:teamId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Successfully left team"
}
```

**Error Responses:**
- `400 Bad Request`: Not a team member or team leader cannot leave
- `404 Not Found`: Team not found

---

### Media

The Media endpoints provide presigned URLs for uploading images and documents directly to S3.

#### Presign Image Upload

Generate a presigned POST policy for uploading an image directly to S3.

```http
POST /media/presign-image
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "purpose": "HACKATHON_BANNER",
  "mimeType": "image/png"
}
```

**Purpose Values:** `HACKATHON_BANNER`, `EVENT_ATTACHMENT`, `OPPORTUNITY_ATTACHMENT`

**Supported Image MIME Types:**
- `image/jpeg`
- `image/png`
- `image/webp`
- `image/gif`

**Response (201):**
```json
{
  "uploadUrl": "https://oppskills-media.s3.amazonaws.com",
  "fields": {
    "key": "hackathons/2025/banner-image.jpg",
    "Content-Type": "image/jpeg",
    "policy": "eyJleHBpcmF0aW9uIj...",
    "x-amz-signature": "1234567890abcdef..."
  },
  "key": "hackathons/2025/banner-image.jpg",
  "publicUrl": "https://cdn.oppskills.com/hackathons/2025/banner-image.jpg",
  "maxBytes": 5242880
}
```

**Using the Presigned Upload:**

1. The client receives the presigned URL and fields
2. Client uploads the file to S3 using a multipart/form-data POST request
3. Client stores the `publicUrl` in the hackathon/festival record

**Example Upload (using fetch):**
```javascript
const formData = new FormData();
Object.entries(response.fields).forEach(([key, value]) => {
  formData.append(key, value);
});
formData.append('file', imageFile);

await fetch(response.uploadUrl, {
  method: 'POST',
  body: formData
});
```

**Error Responses:**
- `400 Bad Request`: Unsupported MIME type or invalid purpose

---

#### Presign Document Upload

Generate a presigned POST policy for uploading documents (PDF, DOC, etc.) directly to S3.

```http
POST /media/presign-document
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "purpose": "EVENT_ATTACHMENT",
  "mimeType": "application/pdf",
  "fileName": "event-rules.pdf"
}
```

**Purpose Values:** `EVENT_ATTACHMENT`, `OPPORTUNITY_ATTACHMENT`

**Supported Document MIME Types:**
- `application/pdf`
- `application/msword`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `application/vnd.ms-excel`
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- `application/vnd.ms-powerpoint`
- `application/vnd.openxmlformats-officedocument.presentationml.presentation`

**Response (201):**
```json
{
  "uploadUrl": "https://oppskills-media.s3.amazonaws.com",
  "fields": {
    "key": "attachments/events/2025/document.pdf",
    "Content-Type": "application/pdf",
    "policy": "eyJleHBpcmF0aW9uIj...",
    "x-amz-signature": "1234567890abcdef..."
  },
  "key": "attachments/events/2025/document.pdf",
  "publicUrl": "https://cdn.oppskills.com/attachments/events/2025/document.pdf",
  "maxBytes": 10485760
}
```

**Error Responses:**
- `400 Bad Request`: Unsupported MIME type or invalid purpose

---

### User Accounts

#### Search Users by Email

Search for users by email address (partial, case-insensitive match). Returns up to 10 results. Useful for role assignment autocomplete.

```http
GET /user-accounts/search?q=john@
Authorization: Bearer <token>
```

**Query Parameters:**
- `q` (required): Search query (email pattern)

**Response (200):**
```json
[
  {
    "id": "user_abc123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "imageUrl": "https://example.com/avatar.jpg"
  },
  {
    "id": "user_def456",
    "email": "john.smith@example.com",
    "firstName": "John",
    "lastName": "Smith",
    "imageUrl": "https://example.com/avatar2.jpg"
  }
]
```

---

#### Clerk Webhook (Internal)

This endpoint is used internally by Clerk to sync user events. Do not call this endpoint directly.

```http
POST /user-accounts/clerk-webhook
Headers:
  svix-id: <signature-id>
  svix-timestamp: <timestamp>
  svix-signature: <signature>
```

This webhook handles user creation, updates, and deletion events from Clerk.

---

## Common Workflows

### Creating and Publishing a Hackathon

1. **Create hackathon** (POST `/hackathons`) - Creates in DRAFT status
2. **Update hackathon details** (PUT `/hackathons/:id`) - Add/update information
3. **Update rounds** (PUT `/hackathons/:id/rounds`) - Configure competition rounds
4. **Update prize breakdown** (PUT `/hackathons/:id/prize-breakdown`) - Set prizes
5. **Update registration form** (PUT `/hackathons/:id/registration-form`) - Configure registration
6. **Add managers/evaluators** (POST `/hackathons/:id/roles`) - Assign team members
7. **Publish hackathon** (PATCH `/hackathons/:id/status`) - Change status to PUBLISHED

### Uploading a Hackathon Banner

1. **Request presigned URL** (POST `/media/presign-image`)
2. **Upload image to S3** using the presigned URL and fields
3. **Update hackathon** (PUT `/hackathons/:id`) with the `publicUrl` as `bannerImageUrl`

### Team Formation

1. **User creates team** (POST `/hackathons/create-team`)
2. **Share invitation code** with team members
3. **Team members join** (POST `/hackathons/join-team`)
4. **View team details** (GET `/hackathons/team/:teamId`)

---

## Rate Limiting

Currently, no rate limiting is enforced. This may change in future versions.

## Versioning

The API does not currently use versioning. Breaking changes will be documented in release notes.

## Support

For API support and questions, please contact the development team or refer to the project documentation at `/docs/README.md`.
