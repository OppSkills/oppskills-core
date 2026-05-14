# Festival Organizer API (Recursive)

Documentation for managing festivals (collections of opportunities) within the organizer dashboard.

---

## 1. Dashboard (`/dashboard/festivals/:slug`)

Overview of the festival status and its children opportunities.

- **My Festivals**: `GET /festivals/my`
  - Paginated list of festivals owned by the user.
- **Full Detail**: `GET /festivals/:id`
  - Returns metadata, location, and a list of all associated hackathons/events.

---

## 2. Content Management

Festivals primarily serve as containers for other opportunities.

- **List Hackathons**: `GET /festivals/:id/hackathons`
  - Returns all hackathons currently linked to this festival.

---

## 3. Edit Festival (`/dashboard/festivals/:slug/edit`)

- **Update Basic Info**: `PUT /festivals/:id`
  - Modify name, dates, description, poster image, and location.
- **Update Status**: `PATCH /festivals/:id/status`
  - Lifecycle transitions: `DRAFT`, `PUBLISHED`, `ONGOING`, `COMPLETED`, `CANCELLED`.

---

## 4. Lifecycle & Settings

- **Delete Festival**: `DELETE /festivals/:id`
  - Permanently removes the festival (soft delete).
