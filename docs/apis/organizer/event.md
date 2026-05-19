# Event Organizer API

This guide covers all the endpoints an organizer needs to manage a specific event in their dashboard.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Dashboard & Analytics

### Get Full Event Context (`GET /events/by-slug/:slug`)
- **Usage:** Fetches the complete event data (including configuration and settings).

### Analytics
- **General Stats:** `GET /analytics/event/:slug/general`
- **Detailed Stats:** `GET /analytics/event/:slug/detailed`

### React Native Example (TanStack Query)
```typescript
const { data: eventDetails } = useQuery({
  queryKey: ['event', slug],
  queryFn: () => apiClient.request(`/events/by-slug/${slug}`),
});
```

---

## 2. Manage Registrations

### View Participants
- **List All:** `GET /events/by-slug/:slug/registrations`
- **View One:** `GET /events/by-slug/:slug/registrations/:participantId` (Includes their form answers).
- **Export Answers:** `GET /events/by-slug/:slug/registrations-answers`

### Approvals & Control
- **Approve Participant:** `POST /events/by-slug/:slug/participants/:participantId/approve`
- **Bulk Approve:** `POST /events/by-slug/:slug/participants/bulk-approve`
- **Pause Signups:** `PATCH /events/:id/registration` (Body: `{ "isRegistrationPaused": true }`)

---

## 3. Edit Event Configuration

Instead of sending the whole event object back and forth, update specific pieces:
- **Basic Info:** `PUT /events/:id`
- **Registration Form:** `PUT /events/:id/registration-form`
- **Prizes:** `PUT /events/:id/prize-breakdown`
- **Additional Info:** `PUT /events/:id/additional-info`

---

## 4. Tickets & Roles

### Tickets
- **List/Manage Tiers:** `GET`, `POST`, `PATCH`, `DELETE` at `/events/:slug/tickets`

### Roles
- **Manage Team:** `GET`, `POST`, `DELETE` at `/events/:id/roles` (Assign co-managers or evaluators).

---

## 5. Lifecycle & Settings

- **Update Status:** `PATCH /events/:id/status` (Transitions between `DRAFT`, `PUBLISHED`, `COMPLETED`, etc.)
- **Submit for Approval:** `POST /events/:id/submit-approval`
- **Set Capacity:** `PUT /events/:id/max-users`
