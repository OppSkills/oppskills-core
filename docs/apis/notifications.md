# Notifications and Email API

This document covers how organizers send announcements and emails to their participants, and how to fetch the delivery status of those campaigns.

These endpoints are typically used in the Organizer Dashboard. If you are calling these from the mobile app, follow the `apiClient.request` and TanStack Query patterns outlined in the `mobile-client-guide.md`.

---

## 1. In-App Notifications (`/notification`)

Organizers use these endpoints to broadcast alerts directly to their participants' in-app notification centers. The backend uses a background queue to ensure fast delivery.

### Schedule a Notification
- **Endpoint:** `POST /notification/schedule`
- **Usage:** Create a new announcement for an event or hackathon. You can send it instantly or schedule it for later.
- **Body:**
  ```json
  {
    "eventId": "evt_123", // Use hackathonId if this is for a hackathon
    "content": "Hackathon starts in 1 hour!",
    "scheduleType": "IMMEDIATELY" // Or "CUSTOM" if providing a 'scheduledAt' date
  }
  ```
- **React Native Example (TanStack Query):**
  ```typescript
  const scheduleNotification = useMutation({
    mutationFn: (data) => apiClient.request('/notification/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      // Refresh the campaign list immediately so the UI reflects the new notification
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns(eventId) });
    },
  });
  ```

### List Campaigns
- **Endpoints:** 
  - `GET /notification/event/:eventId`
  - `GET /notification/hackathon/:hackathonId`
- **Usage:** Fetch the history of all announcements sent for a specific listing. The response includes delivery stats (`successCount`, `failedCount`) and detailed logs.
- **React Native Example:**
  ```typescript
  const { data: campaigns } = useQuery({
    queryKey: queryKeys.campaigns(eventId),
    queryFn: () => apiClient.request(`/notification/event/${eventId}`),
    staleTime: 30000, // Safe to cache for 30 seconds to prevent over-fetching
  });
  ```

### Manage a Specific Campaign
- **Get Details:** `GET /notification/:id` 
  - **Usage:** Fetch the full details and logs of a single campaign.
- **Cancel Campaign:** `DELETE /notification/:id` 
  - **Usage:** Stops a campaign from sending, but **only** works if its status is still `QUEUED`.

---

## 2. Email Service (`/email`)

These endpoints allow organizers to send raw emails (HTML or text) directly to participants' inboxes.

### Send a Direct Email
- **Endpoint:** `POST /email/messages/direct`
- **Usage:** Send a one-off transactional email to a single user.
- **Body:**
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

### Send a Bulk Email Campaign
- **Endpoint:** `POST /email/bulk`
- **Usage:** Queue an email to be sent to *all* participants of an event or hackathon. The backend automatically processes this in the background.
- **Body:**
  ```json
  {
    "eventId": "evt_123", // Use hackathonId if this is for a hackathon
    "htmlBody": "<h1>Welcome to the Hackathon!</h1>"
  }
  ```

### Send Reminders (Incomplete Registrations)
- **Endpoint:** `POST /email/incomplete-registration/:eventId`
- **Usage:** Automatically trigger a backend script that finds users who have paid for a ticket but haven't submitted their required forms, and emails them a reminder to finish their registration.
