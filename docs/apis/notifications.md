# Notifications and Email API

This document covers how organizers send announcements and emails to their participants, and how to fetch the delivery status of those campaigns.

These endpoints are typically used in the Organizer Dashboard. If you are calling these from the mobile app, follow the `apiClient.request` and TanStack Query patterns outlined in the `mobile-client-guide.md`.

---

## 1. In-App Notifications (`/notification`)

Organizers use these endpoints to broadcast alerts directly to their participants' in-app notification centers. The backend uses a background queue to ensure fast delivery.

### Schedule a Notification

- **Endpoint:** `POST /notification/schedule`
- **Usage:** Create a new announcement for an event or hackathon. You can send it instantly or schedule it for later.
- **Request Body:**
  ```json
  {
    "eventId": "evt_123", // Use hackathonId if this is for a hackathon
    "content": "Hackathon starts in 1 hour!",
    "scheduleType": "IMMEDIATELY" // Or "CUSTOM" if providing a 'scheduledAt' date
  }
  ```
- **Returns:**
  ```json
  {
    "id": "notif_123",
    "userId": "usr_organizer",
    "eventId": "evt_123",
    "hackathonId": null,
    "content": "Hackathon starts in 1 hour!",
    "scheduleType": "IMMEDIATELY",
    "scheduledAt": "2026-05-19T10:00:00.000Z",
    "status": "QUEUED",
    "totalRecipients": 42,
    "processedCount": 0,
    "successCount": 0,
    "failedCount": 0,
    "expectedFinishAt": "2026-05-19T10:00:10.000Z",
    "completedAt": null,
    "createdAt": "2026-05-19T09:59:50.000Z"
  }
  ```
- **React Native Example (TanStack Query):**
  ```typescript
  const scheduleNotification = useMutation({
    mutationFn: (data) =>
      apiClient.request("/notification/schedule", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns(eventId) });
    },
  });
  ```

### List Campaigns

- **Endpoints:**
  - `GET /notification/event/:eventId`
  - `GET /notification/hackathon/:hackathonId`
- **Usage:** Fetch the history of all announcements sent for a specific listing.
- **Returns:** An array of notification campaign objects:
  ```json
  [
    {
      "id": "notif_123",
      "userId": "usr_organizer",
      "eventId": "evt_123",
      "hackathonId": null,
      "content": "Hackathon starts in 1 hour!",
      "scheduleType": "IMMEDIATELY",
      "scheduledAt": "2026-05-19T10:00:00.000Z",
      "status": "COMPLETED",
      "totalRecipients": 42,
      "processedCount": 42,
      "successCount": 40,
      "failedCount": 2,
      "expectedFinishAt": "2026-05-19T10:00:10.000Z",
      "completedAt": "2026-05-19T10:00:08.000Z",
      "createdAt": "2026-05-19T09:59:50.000Z",
      "logs": [
        {
          "id": "log_123",
          "level": "INFO",
          "message": "Notification created and enqueued with delay of 0ms",
          "meta": {},
          "createdAt": "2026-05-19T09:59:51.000Z"
        }
      ]
    }
  ]
  ```

### Manage a Specific Campaign

- **Get Details:** `GET /notification/:id`
  - **Usage:** Fetch the full details and logs of a single campaign. Returns a single notification object as shown in the List Campaigns response.
- **Cancel Campaign:** `DELETE /notification/:id`
  - **Usage:** Stops a campaign from sending, but **only** works if its status is still `QUEUED`.
  - **Returns:** The deleted notification details.

---

## 2. Email Service (`/email`)

These endpoints allow organizers to send raw emails (HTML or text) directly to participants' inboxes.

### Send a Direct Email

- **Endpoint:** `POST /email/messages/direct`
- **Usage:** Send a one-off transactional email to a single user.
- **Request Body:**
  ```json
  {
    "userId": "usr_123",
    "email": "user@example.com",
    "firstName": "John",
    "eventId": "evt_456",
    "eventName": "Tech Meetup",
    "eventSlug": "tech-meetup-2025",
    "htmlBody": "<p>Hello John...</p>"
  }
  ```
- **Returns:**
  ```json
  {
    "success": true,
    "message": "Email queued successfully"
  }
  ```

### Send a Bulk Email Campaign

- **Endpoint:** `POST /email/bulk`
- **Usage:** Queue an email to be sent to _all_ participants of an event or hackathon. The backend automatically processes this in the background.
- **Request Body:**
  ```json
  {
    "eventId": "evt_123", // Or use 'hackathonId'
    "htmlBody": "<h1>Welcome to the Hackathon!</h1>"
  }
  ```
- **Returns:**
  ```json
  {
    "success": true,
    "message": "Bulk email started successfully. You will be notified when it is finished."
  }
  ```

### Send Reminders (Incomplete Registrations)

- **Endpoint:** `POST /email/incomplete-registration/:eventId`
- **Usage:** Automatically find users who have paid for a ticket but haven't submitted their required forms, and email them a reminder.
- **Returns:**
  ```json
  {
    "success": true,
    "message": "Sent 10 emails, 2 failed.",
    "emailsSent": 10,
    "emailsFailed": 2,
    "totalIncompleteUsers": 12
  }
  ```
