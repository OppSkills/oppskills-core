# Authentication and Authorization API

Reference for authentication methods, user roles, and infrastructure syncing.

## Overview

OppSkills uses Clerk for authentication. Protected endpoints require a valid Clerk JWT in the `Authorization` header.

- **Base URL**: `http://localhost:3001` (Dev) / `https://api.oppskills.com` (Prod)
- **Auth Method**: `Bearer <clerk_jwt_token>`
- **Development Bypass**: In dev environments, use `X-User-Id` header.

---

## User Profile

Documentation for profile management and history is located in the User Profile module:

[User Profile API](user_profile.md)

---

## Authorization and Roles

### Search Users by Email (`GET /user-accounts/search?q=...`)

Search for users by email. Used for autocomplete in role assignment.

**Query Params:**
- `q`: Search string

**Response (200 OK):**
```json
[
  {
    "id": "user_123",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "imageUrl": "https://..."
  }
]
```

---

### Manage Hackathon Roles

Endpoints for managing hackathon administrative roles (Managers and Evaluators).

#### List Roles (`GET /hackathons/:id/roles`)
```json
{
  "owner": { "id": "user_123", "email": "..." },
  "managers": [ { "id": "user_456", "email": "...", "role": "MANAGER" } ],
  "evaluators": []
}
```

#### Add Role (`POST /hackathons/:id/roles`)
**Body:**
```json
{
  "email": "manager@example.com",
  "role": "MANAGER"
}
```

#### Remove Role (`DELETE /hackathons/:id/roles`)
**Body:**
```json
{
  "email": "manager@example.com",
  "role": "MANAGER"
}
```

---

## Infrastructure

### Clerk Webhook (`POST /user-accounts/clerk-webhook`)

Syncs user lifecycle events (Create, Update, Delete) from Clerk to the local database.

**Headers:**
- `svix-id`, `svix-timestamp`, `svix-signature`: Required for verification.

**Body**: Clerk Webhook Payload

---

## Development Auth Bypass

Local testing without Clerk tokens can be enabled by setting `AUTH_BYPASS=true` in `.env.local`.

**Headers:**
```http
X-User-Id: dev-user-001
X-User-Email: dev@oppskills.com
```

This bypass is disabled in production environments.
