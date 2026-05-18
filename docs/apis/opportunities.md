# Opportunities API

Comprehensive reference for the lifecycle of hackathons, events, and festivals on the OppSkills platform—from creation and configuration to public discovery and joining.

---

## 1. Creation and Configuration

All opportunities are created in a `DRAFT` state. Organizers must flesh out the details before publishing.

### Core Creation Endpoints
- **Create Hackathon**: `POST /hackathons`
- **Create Event**: `POST /events`
- **Create Festival**: `POST /festivals`

**Required Basic Data**:
- `name`: String
- `startDate`: ISO Date
- `endDate`: ISO Date
- `mode`: "ONLINE", "OFFLINE", or "HYBRID" (for hackathons/events)

### Detailed Configuration
Successive `PUT` calls are used to configure specific modules:
- **Rounds (Hackathons only)**: `PUT /hackathons/:id/rounds`
- **Registration Form**: `PUT /hackathons/:id/registration-form` or `PUT /events/:id/registration-form`
- **Prizes**: `PUT /hackathons/:id/prize-breakdown` or `PUT /events/:id/prize-breakdown`
- **Additional Info**: `PUT /hackathons/:id/additional-info` (Contact & Attachments)

---

## 2. Public Listings and Discovery

Endpoints used to populate the public discovery pages (`/hackathons`, `/events`, `/festivals`).

### Discovery and Search
- **Mixed Search**: `GET /opportunity/search?q=...` (Returns hackathons, events, and top results).
- **Autosuggest**: `GET /opportunity/autosuggest?q=...` (Quick dropdown suggestions).
- **Past Opportunities**: `GET /opportunity/public/past` (Lists merged past events/hackathons).

### Public Listing Endpoints
- **List Hackathons**: `GET /hackathons/public`
- **List Events**: `GET /events/public`
- **List Festivals**: `GET /festivals`

**Common Query Parameters**:
- `q`: Search keyword.
- `page` / `take`: Pagination controls.
- `modes`: Filter by `ONLINE`, `OFFLINE`, etc.
- `status`: Filter by `UPCOMING` or `RECENT`.
- `festival_id`: Filter opportunities belonging to a specific festival.

### Upcoming Opportunities
Used for "Featured" sections on the landing page or sidebar.
- **Upcoming Hackathons**: `GET /hackathons/public/upcoming`
- **Upcoming Events**: `GET /events/public/upcoming`

### Opportunity Details
Fetched when a user clicks on a specific opportunity card.
- **By Slug**: `GET /hackathons/public/by-slug/:slug` or `GET /events/public/by-slug/:slug`
- **By ID**: `GET /hackathons/public/:id` or `GET /events/public/:id`

---

## 3. Joining and Registration

Endpoints for users to participate in an opportunity.

### Joining an Event
**Method**: `POST /events/:id/join`  
**Description**: Registers the current user for an event. If the event has a custom form, answers must be provided in the body.

**Payload**:
```json
{
  "answers": [
    { "fieldId": "field_1", "value": "Response text" }
  ],
  "referralCode": "optional_ref_code"
}
```

### Joining a Hackathon
**Method**: `POST /hackathons/:id/register`  
**Description**: Registers the current user for a hackathon. This typically creates a "Solo" team or joins an existing one.

### Registration Utilities
- **Check Status**: `GET /events/:id/my-registration` returns if the user is already joined.
- **Complete Registration**: `POST /events/:id/complete-registration` for submitting form answers after payment (if applicable).
- **Leave**: `DELETE /events/:id/leave` allows a user to unregister.

---

## 4. Lifecycle Management

### Publishing
Once a draft is ready:
1.  **Submit for Approval**: `POST /hackathons/:id/submit-for-approval` or `POST /events/:id/submit-approval` (Notifies Admins).
2.  **Update Status**: `PATCH /hackathons/:id/status` (Manual transition to `PUBLISHED`).

**Status Values**: `DRAFT`, `PUBLISHED`, `ONGOING`, `COMPLETED`, `CANCELLED`.
