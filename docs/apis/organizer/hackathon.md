# Hackathon Organizer API

This guide covers all the endpoints an organizer needs to manage a specific hackathon in their dashboard.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Dashboard & Analytics

### Get Full Hackathon Context (`GET /hackathons/by-slug/:slug`)

- **Usage:** Fetches the complete hackathon data, including all its configuration (rounds, prizes, forms).
- **Returns:**
  ```json
  {
    "id": "hack_123",
    "name": "Global AI Hackathon 2025",
    "slug": "global-ai-hackathon",
    "status": "PUBLISHED",
    "approvalStatus": "APPROVED",
    "startDate": "2025-03-15T10:00:00Z",
    "endDate": "2025-03-17T18:00:00Z",
    "mode": "HYBRID",
    "participantType": "TEAM_OF_2_4",
    "prizeTotalWorthAmount": "10000.00"
  }
  ```

### Analytics

- **General Stats:** `GET /analytics/hackathon/:slug/general`
  - Returns views, impressions, and total registration count.
- **Detailed Trends:** `GET /analytics/hackathon/:slug/detailed`
  - Returns daily registration trends and demographics.

### React Native Example (TanStack Query)

```typescript
const { data: hackathonDetails } = useQuery({
  queryKey: ["hackathon", slug],
  queryFn: () => apiClient.request(`/hackathons/by-slug/${slug}`),
});
```

---

## 2. Manage Registrations & Teams

### View Teams

- **List All Teams:** `GET /hackathons/by-slug/:slug/registrations`
  - **Returns:**
    ```json
    [
      {
        "id": "team_123",
        "name": "SuperCoders",
        "registrationStatus": "SUBMITTED",
        "membersCount": 3,
        "createdAt": "2025-03-15T12:00:00Z"
      }
    ]
    ```
- **View One Team:** `GET /hackathons/by-slug/:slug/teams/:teamId/registration`
- **Export Answers:** `GET /hackathons/by-slug/:slug/teams/:teamId/registration-answers`

### Qualify Teams for Rounds

- **Qualify One Team:** `PUT /hackathons/by-slug/:slug/rounds/:roundId/teams/:teamId/qualification`
  - **Request Body:** `{ "qualified": true }`
  - **Returns:** `{ "success": true, "qualified": true }`
- **Bulk Qualify:** `PUT /hackathons/by-slug/:slug/rounds/:roundId/bulk-qualification`
  - **Request Body:**
    ```json
    {
      "teamIds": ["team_123", "team_456"],
      "qualified": true
    }
    ```
  - **Returns:** `{ "success": true, "qualifiedCount": 2 }`

### Control Registration

- **Pause Signups:** `PATCH /hackathons/:id/registration-paused`
  - **Request Body:** `{ "isRegistrationPaused": true }`
  - **Returns:** `{ "success": true, "isRegistrationPaused": true }`

---

## 3. Edit Hackathon Configuration

Update specific modules of the hackathon without resending the entire object.

- **Basic Info:** `PUT /hackathons/:id`
  - **Request Body:**
    ```json
    {
      "name": "Updated Hackathon Name",
      "startDate": "2025-03-15T10:00:00Z",
      "endDate": "2025-03-17T18:00:00Z",
      "mode": "ONLINE"
    }
    ```
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
  - **Request Body (for POST):**
    ```json
    {
      "userId": "usr_789",
      "role": "MANAGER" // "MANAGER" or "EVALUATOR"
    }
    ```
  - **Returns:** The created role assignment details.

---

## 5. Payments & Notifications

- **Earnings Summary:** `GET /hackathons/:slug/earnings`
- **Payment Logs:** `GET /hackathons/:slug/payments`
- **Email a Team:** `POST /hackathons/:id/teams/:teamId/send-email`
  - **Request Body:**
    ```json
    {
      "subject": "Important update for SuperCoders",
      "htmlBody": "<p>Your project submission was received...</p>"
    }
    ```
  - **Returns:** `{ "success": true, "message": "Email sent to team members" }`

---

## 6. Lifecycle & Settings

- **Update Status:** `PATCH /hackathons/:id/status` (Transitions between `DRAFT`, `PUBLISHED`, `COMPLETED`, etc.)
  - **Request Body:** `{ "status": "PUBLISHED" }`
- **Submit for Approval:** `POST /hackathons/:id/submit-for-approval`
- **Set Capacity:** `PUT /hackathons/:id/max-teams`
  - **Request Body:** `{ "maxTeams": 100 }`
