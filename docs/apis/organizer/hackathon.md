# Hackathon Organizer API

This guide covers all the endpoints an organizer needs to manage a specific hackathon in their dashboard.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Dashboard & Analytics

### Get Full Hackathon Context (`GET /hackathons/by-slug/:slug`)
- **Usage:** Fetches the complete hackathon data, including all its configuration (rounds, prizes, forms).

### Analytics
- **General Stats:** `GET /analytics/hackathon/:slug/general`
- **Detailed Trends:** `GET /analytics/hackathon/:slug/detailed`

### React Native Example (TanStack Query)
```typescript
const { data: hackathonDetails } = useQuery({
  queryKey: ['hackathon', slug],
  queryFn: () => apiClient.request(`/hackathons/by-slug/${slug}`),
});
```

---

## 2. Manage Registrations & Teams

### View Teams
- **List All Teams:** `GET /hackathons/by-slug/:slug/registrations`
- **View One Team:** `GET /hackathons/by-slug/:slug/teams/:teamId/registration`
- **Export Answers:** `GET /hackathons/by-slug/:slug/teams/:teamId/registration-answers`

### Qualify Teams for Rounds
- **Qualify One Team:** `PUT /hackathons/by-slug/:slug/rounds/:roundId/teams/:teamId/qualification`
- **Bulk Qualify:** `PUT /hackathons/by-slug/:slug/rounds/:roundId/bulk-qualification` (Body: `{ "teamIds": ["t_1"], "qualified": true }`)

### Control Registration
- **Pause Signups:** `PATCH /hackathons/:id/registration-paused`

---

## 3. Edit Hackathon Configuration

Update specific modules of the hackathon without resending the entire object.
- **Basic Info:** `PUT /hackathons/:id`
- **Rounds:** `PUT /hackathons/:id/rounds`
- **Registration Form:** `PUT /hackathons/:id/registration-form`
- **Prizes:** `PUT /hackathons/:id/prize-breakdown`
- **Additional Info:** `PUT /hackathons/:id/additional-info`

---

## 4. Referrals & Roles

### Referrals
- **List Campaigns:** `GET /referrals?opportunityId=...`
- **Create Code:** `POST /referrals`

### Roles
- **Manage Team:** `GET`, `POST`, `DELETE` at `/hackathons/:id/roles` (Assign co-managers or evaluators).

---

## 5. Payments & Notifications

- **Earnings Summary:** `GET /hackathons/:slug/earnings`
- **Payment Logs:** `GET /hackathons/:slug/payments`
- **Email a Team:** `POST /hackathons/:id/teams/:teamId/send-email` (Broadcasts an email to all team members).

---

## 6. Lifecycle & Settings

- **Update Status:** `PATCH /hackathons/:id/status` (Transitions between `DRAFT`, `PUBLISHED`, `COMPLETED`, etc.)
- **Submit for Approval:** `POST /hackathons/:id/submit-for-approval`
- **Set Capacity:** `PUT /hackathons/:id/max-teams`
