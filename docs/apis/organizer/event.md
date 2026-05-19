# Event Organizer API

This guide covers all the endpoints an organizer needs to manage a specific event in their dashboard.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Dashboard & Analytics

### Get Full Event Context (`GET /events/by-slug/:slug`)
- **Usage:** Fetches the complete event data (including configuration and settings).
- **Returns:**
  ```json
  {
    "id": "evt_123",
    "name": "Tech Conference 2025",
    "slug": "tech-conf-2025",
    "description": "Yearly conference about new tech trends.",
    "status": "PUBLISHED",
    "approvalStatus": "APPROVED",
    "ownerId": "usr_organizer",
    "startDate": "2025-04-10T09:00:00Z",
    "endDate": "2025-04-12T17:00:00Z",
    "locationType": "PHYSICAL",
    "locationAddress": "789 Event hall Rd",
    "locationCity": "Austin"
  }
  ```

### Analytics
- **General Stats:** `GET /analytics/event/:slug/general`
  - Returns views, impressions, and total registration count.
- **Detailed Stats:** `GET /analytics/event/:slug/detailed`
  - Returns registration trends and gender demographics.

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
  - **Returns:**
    ```json
    [
      {
        "id": "part_123",
        "userId": "usr_456",
        "user": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "registrationStatus": "PENDING",
        "createdAt": "2025-03-15T12:00:00Z"
      }
    ]
    ```
- **View One:** `GET /events/by-slug/:slug/registrations/:participantId` (Includes their form answers).
- **Export Answers:** `GET /events/by-slug/:slug/registrations-answers`

### Approvals & Control
- **Approve Participant:** `POST /events/by-slug/:slug/participants/:participantId/approve`
  - **Returns:** `{ "success": true }`
- **Bulk Approve:** `POST /events/by-slug/:slug/participants/bulk-approve`
  - **Request Body:**
    ```json
    {
      "participantIds": ["part_123", "part_456"]
    }
    ```
  - **Returns:** `{ "success": true, "approvedCount": 2 }`
- **Pause Signups:** `PATCH /events/:id/registration`
  - **Request Body:** `{ "isRegistrationPaused": true }`
  - **Returns:** `{ "success": true, "isRegistrationPaused": true }`

---

## 3. Edit Event Configuration

Instead of sending the whole event object back and forth, update specific pieces:
- **Basic Info:** `PUT /events/:id`
  - **Request Body:**
    ```json
    {
      "name": "Updated Event Name",
      "description": "Updated Description",
      "startDate": "2025-04-10T10:00:00Z",
      "endDate": "2025-04-12T18:00:00Z",
      "mode": "ONLINE"
    }
    ```
- **Registration Form:** `PUT /events/:id/registration-form`
- **Prizes:** `PUT /events/:id/prize-breakdown`
- **Additional Info:** `PUT /events/:id/additional-info`

---

## 4. Tickets & Roles

### Tickets
- **List/Manage Tiers:** `GET`, `POST`, `PATCH`, `DELETE` at `/events/:slug/tickets`

### Roles
- **Manage Team:** `GET`, `POST`, `DELETE` at `/events/:id/roles` (Assign co-managers or evaluators).
  - **Request Body (for POST):**
    ```json
    {
      "userId": "usr_789",
      "role": "MANAGER" // "MANAGER" or "EVALUATOR"
    }
    ```
  - **Returns:** The created role assignment details.

---

## 5. Lifecycle & Settings

- **Update Status:** `PATCH /events/:id/status` (Transitions between `DRAFT`, `PUBLISHED`, `COMPLETED`, etc.)
  - **Request Body:** `{ "status": "PUBLISHED" }`
- **Submit for Approval:** `POST /events/:id/submit-approval`
- **Set Capacity:** `PUT /events/:id/max-users`
  - **Request Body:** `{ "maxUsers": 500 }`
