# Organizer API

Reference for endpoints used by organizers (owners and managers) to manage their opportunities from the dashboard.

---

## 1. Dashboard Overview

Endpoints for listing opportunities where the authenticated user has management permissions.

### List My Opportunities
- **Hackathons**: `GET /hackathons/my`
- **Events**: `GET /events/my`
- **Festivals**: `GET /festivals/my`

**Query Parameters**:
- `page`: Page number (default: 1).
- `take`: Items per page (default: 10).

---

## 2. Opportunity Details (Full Data)

Returns complete opportunity data, including non-public configuration and participant summaries.

- **Hackathon Details**: `GET /hackathons/by-slug/:slug`
- **Event Details**: `GET /events/by-slug/:slug`

---

## 3. Participant Management

### Hackathons (Teams and Submissions)
- **List Teams**: `GET /hackathons/by-slug/:slug/registrations`  
  Returns a list of teams, their members, and their submission status across all rounds.
- **Team Registration Detail**: `GET /hackathons/by-slug/:slug/teams/:teamId/registration`
- **Registration Answers**: `GET /hackathons/by-slug/:slug/teams/:teamId/registration-answers`

### Events (Individual Participants)
- **List Participants**: `GET /events/by-slug/:slug/registrations`
- **Participant Detail**: `GET /events/by-slug/:slug/registrations/:participantId`
- **Bulk Registration Answers**: `GET /events/by-slug/:slug/registrations-answers`

### Approval Actions
- **Approve Participant**: `POST /events/by-slug/:slug/participants/:participantId/approve`
- **Bulk Approve**: `POST /events/by-slug/:slug/participants/bulk-approve`

---

## 4. Role Management

Organizers can assign others to help manage or evaluate opportunities.

- **Get Roles**: `GET /hackathons/:id/roles` or `GET /events/:id/roles`
- **Add Role**: `POST /hackathons/:id/roles` or `POST /events/:id/roles`
- **Remove Role**: `DELETE /hackathons/:id/roles` or `DELETE /events/:id/roles`

**Roles**:
- `MANAGER`: Full management access.
- `EVALUATOR`: Access to view and score submissions (future feature).

---

## 5. Operations and Communication

### Registration Control
- **Pause/Resume**: `PATCH /hackathons/:id/registration-paused` or `PATCH /events/:id/registration`
  - Body: `{ "isRegistrationPaused": boolean }`

### Communication
- **Send Team Email**: `POST /hackathons/:id/teams/:teamId/send-email`
  - Body: `{ "subject": "...", "body": "HTML content" }`
  - Sends a custom email to all members of the specified team.

---

## 6. Editing and Settings

Organizers can update various modules of an opportunity throughout its lifecycle (primarily while in `DRAFT`, `PUBLISHED`, or `ONGOING` status).

### General Updates
- **Update Hackathon**: `PUT /hackathons/:id`
- **Update Event**: `PUT /events/:id`
- **Update Festival**: `PUT /festivals/:id`

### Module-Specific Settings
These endpoints allow for granular updates without sending the full opportunity object.
- **Rounds (Hackathons)**: `PUT /hackathons/:id/rounds`
- **Max Teams (Hackathons)**: `PUT /hackathons/:id/max-teams`
- **Max Users (Events)**: `PUT /events/:id/max-users`
- **Registration Form**: `PUT /<type>/:id/registration-form`
- **Prize Breakdown**: `PUT /<type>/:id/prize-breakdown`
- **Additional Info**: `PUT /<type>/:id/additional-info` (Contact details and file attachments)

---

## 7. Round and Submission Control (Hackathons)

### Qualification
- **Set Qualification**: `PUT /hackathons/by-slug/:slug/rounds/:roundId/teams/:teamId/qualification`
- **Bulk Qualification**: `PUT /hackathons/by-slug/:slug/rounds/:roundId/bulk-qualification`
  - Body: `{ "teamIds": ["id1", "id2"], "qualified": true }`
