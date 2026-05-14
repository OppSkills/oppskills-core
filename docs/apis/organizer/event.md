# Event Organizer API (Recursive)

Detailed documentation for managing events within the organizer dashboard.

---

## 1. Dashboard (`/dashboard/events/:slug`)

Overview of event engagement and participation.

### 1.1 Analytics
- **General Stats**: `GET /analytics/event/:slug/general`
  - Views, impressions, total registrations, and period-specific growth.
- **Detailed Analytics**: `GET /analytics/event/:slug/detailed`
  - Registration trends and demographic (gender) breakdown.

### 1.2 Status & Context
- **Full Context**: `GET /events/by-slug/:slug`
  - Returns complete configuration, participant summaries, and settings.

---

## 2. Manage Registration (`/dashboard/events/:slug/registrations`)

### 2.1 Participant Management
- **List Participants**: `GET /events/by-slug/:slug/registrations`
  - Paginated list of all joined users.
- **Participant Detail**: `GET /events/by-slug/:slug/registrations/:participantId`
  - Specific details and custom form answers for one participant.
- **Bulk Registration Answers**: `GET /events/by-slug/:slug/registrations-answers`
  - Exports answers for all participants at once.

### 2.2 Approvals
- **Approve Participant**: `POST /events/by-slug/:slug/participants/:participantId/approve`
- **Bulk Approve**: `POST /events/by-slug/:slug/participants/bulk-approve`
  - Body: `{ "participantIds": string[] }`

### 2.3 Registration Control
- **Pause/Resume**: `PATCH /events/:id/registration`
  - Body: `{ "isRegistrationPaused": boolean }`

---

## 3. Edit Event (`/dashboard/events/:slug/edit`)

### 3.1 Module Configuration
- **Update Basic Info**: `PUT /events/:id`
- **Registration Form**: `PUT /events/:id/registration-form`
- **Prize Breakdown**: `PUT /events/:id/prize-breakdown`
- **Additional Info**: `PUT /events/:id/additional-info` (Contact & Attachments)

---

## 4. Referrals (`/dashboard/events/:slug/referrals`)

- **Campaign Stats**: `GET /referrals/analytics?opportunityId=...`
- **List Referrals**: `GET /referrals?opportunityId=...`
- **Create Code**: `POST /referrals`

---

## 5. Manage Roles (`/dashboard/events/:slug/roles`)

- **Get Roles**: `GET /events/:id/roles`
- **Add/Remove Role**: `POST /events/:id/roles` | `DELETE /events/:id/roles`

---

## 6. Payments (`/dashboard/events/:slug/payments`)

Comprehensive financial tools for organizers.

- **Earnings Summary**: `GET /events/:slug/earnings`
  - Net earnings, share breakdown, and payout status.
- **Payments Log**: `GET /events/:slug/payments`
  - Detailed transaction history.
- **Pricing Settings**: `PATCH /events/:slug/pricing`
  - Update entry fees, fee bearer (organizer vs participant), and currency.
- **Discount Codes**:
  - `POST /events/:slug/discount-codes`: Create new code.
  - `GET /events/:slug/discount-codes`: List all.
  - `PATCH /events/:slug/discount-codes/:codeId`: Update (active status, limit).
  - `DELETE /events/:slug/discount-codes/:codeId`: Delete.

---

## 7. Settings (`/dashboard/events/:slug/settings`)

- **Lifecycle**: `PATCH /events/:id/status`
- **Capacity**: `PUT /events/:id/max-users`
