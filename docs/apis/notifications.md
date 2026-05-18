# Notifications and Email API

API reference for the in-app notification center and external email communication modules.

## Overview

OppSkills uses a centralized notification service to send real-time alerts to users via an in-app dashboard, as well as an email service for transactional emails and batch marketing campaigns.

---

## 1. Organizer Batch Notifications (`/notification`)

This module allows organizers to schedule and send batch announcements to all participants of their Hackathon or Event. It runs on a background worker queue to handle hundreds of recipients without timing out.

### Schedule Notification (`POST /notification/schedule`)
**Method**: `POST`
**Description**: Queues a new outbound announcement.
**Body Example**:
```json
{
  "eventId": "evt_123", // OR hackathonId
  "content": "Hackathon starts in 1 hour!",
  "scheduleType": "IMMEDIATELY" // or "CUSTOM" with scheduledAt
}
```

### List Campaign History
- **Event Campaigns**: `GET /notification/event/:eventId`
- **Hackathon Campaigns**: `GET /notification/hackathon/:hackathonId`
**Description**: Returns a list of all scheduled or completed campaigns for the specified opportunity, including their real-time delivery logs (`logs` array), `successCount`, and `failedCount`.

### Manage Campaigns
- **Get Detail**: `GET /notification/:id`
- **Cancel Campaign**: `DELETE /notification/:id` (Only works if the status is still QUEUED).

---

## 2. Email Service

Endpoints used by organizers to send transactional emails and bulk communications to participants directly via the backend email service.

### Direct Message (`POST /email/messages/direct`)
**Method**: `POST`
**Description**: Sends a direct transactional email to a specific user.
**Body Example**:
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

### Bulk Email (`POST /email/bulk`)
**Method**: `POST`
**Description**: Initializes a queue-based batch email campaign. Used by organizers to send HTML announcements to all participants of a specific event or hackathon.
**Body Example**:
```json
{
  "eventId": "evt_123", // OR hackathonId
  "htmlBody": "<h1>Welcome to the Hackathon!</h1>"
}
```

### Incomplete Registration Reminder (`POST /email/incomplete-registration/:eventId`)
**Method**: `POST`
**Description**: Automatically finds users who have paid for an event but have not yet submitted their registration form, and sends them a templated reminder email with the event details.
