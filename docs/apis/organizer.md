# Organizer API

This guide covers the dashboard endpoints organizers use to manage their opportunities and participants.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Dashboard Overview

### List My Opportunities
- **Endpoints:** `GET /hackathons/my`, `GET /events/my`, `GET /festivals/my`
- **Usage:** Fetches all listings the current user manages.

### React Native Example (TanStack Query)
```typescript
const { data: myHackathons } = useQuery({
  queryKey: ['organizer', 'hackathons'],
  queryFn: () => apiClient.request('/hackathons/my?page=1&take=10'),
});
```

---

## 2. Participant & Team Management

### View Registrations
- **Hackathon Teams:** `GET /hackathons/by-slug/:slug/registrations`
- **Event Participants:** `GET /events/by-slug/:slug/registrations`
- **Usage:** Lists everyone who signed up.

### Approvals
- **Approve One:** `POST /events/by-slug/:slug/participants/:participantId/approve`
- **Bulk Approve:** `POST /events/by-slug/:slug/participants/bulk-approve`

### Control Registration
- **Pause/Resume Signups:** `PATCH /hackathons/:id/registration-paused` (Body: `{ "isRegistrationPaused": true }`)

---

## 3. Role Management

Organizers can invite co-managers or evaluators to help run the event.

- **View Roles:** `GET /hackathons/:id/roles`
- **Add Role:** `POST /hackathons/:id/roles` (Roles: `MANAGER`, `EVALUATOR`)
- **Remove Role:** `DELETE /hackathons/:id/roles`

---

## 4. Editing Opportunities

Organizers update pieces of their event using module-specific endpoints so they don't have to send the entire massive object back and forth.

- **General Info:** `PUT /hackathons/:id` or `PUT /events/:id`
- **Max Teams:** `PUT /hackathons/:id/max-teams`
- **Prizes:** `PUT /hackathons/:id/prize-breakdown`
