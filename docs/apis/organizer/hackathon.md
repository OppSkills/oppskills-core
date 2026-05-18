# Hackathon Organizer API (Recursive)

Detailed documentation for the entire hackathon management workflow within the organizer dashboard.

---

## 1. Dashboard (`/dashboard/hackathons/:slug`)

Primary entry point for organizers to see the health and status of their hackathon.

### 1.1 Analytics Overview
- **My Hackathons**: `GET /hackathons/my`
  - Paginated list of hackathons owned or managed by the user.
- **General Stats**: `GET /analytics/hackathon/:slug/general`
  - Returns: Total registrations, period registrations, views, and impressions.
- **Detailed Analytics**: `GET /analytics/hackathon/:slug/detailed`
  - Returns: Registration trends over time and gender breakdown.
- **Top Listings**: `GET /analytics/organizer-top-listings`
  - Comparison of current hackathon vs other managed listings.

### 1.2 Status & Context
- **Full Context**: `GET /hackathons/by-slug/:slug`
  - Retrieves all configuration (rounds, prizes, form) and current status.

---

## 2. Manage Registration (`/dashboard/hackathons/:slug/registrations`)

Tools for reviewing, approving, and qualifying participants and teams.

### 2.1 Team Management
- **List Teams**: `GET /hackathons/by-slug/:slug/registrations`
  - Supports pagination (`page`, `take`). Returns team details, leader info, and submission counts.
- **Team Detail**: `GET /hackathons/by-slug/:slug/teams/:teamId/registration`
  - Deep dive into a specific team's status and members.
- **Registration Answers**: `GET /hackathons/by-slug/:slug/teams/:teamId/registration-answers`
  - Retrieves custom form responses for all members of the team.

### 2.2 Qualification Workflow
- **Single Team Qualification**: `PUT /hackathons/by-slug/:slug/rounds/:roundId/teams/:teamId/qualification`
  - Body: `{ "qualified": boolean }`
- **Bulk Qualification**: `PUT /hackathons/by-slug/:slug/rounds/:roundId/bulk-qualification`
  - Body: `{ "teamIds": string[], "qualified": boolean }`

### 2.3 Registration Control
- **Pause/Resume**: `PATCH /hackathons/:id/registration-paused`
  - Body: `{ "isRegistrationPaused": boolean }`

---

## 3. Edit Hackathon (`/dashboard/hackathons/:slug/edit`)

Granular updates to the hackathon's structure and content.

### 3.1 Module Configuration
- **Update Basic Info**: `PUT /hackathons/:id`
- **Manage Rounds**: `PUT /hackathons/:id/rounds`
  - Configures round names, dates, and submission requirements.
- **Registration Form**: `PUT /hackathons/:id/registration-form`
  - Defines the custom fields users must answer.
- **Prizes**: `PUT /hackathons/:id/prize-breakdown`
- **Additional Info**: `PUT /hackathons/:id/additional-info`
  - Updates contact info, FAQs, and attachments.

---

## 4. Referrals (`/dashboard/hackathons/:slug/referrals`)

Tracking and managing referral campaigns for the hackathon.

### 4.1 Referral Analytics
- **Campaign Stats**: `GET /referrals/analytics?opportunityId=...`
  - Aggregated performance of all referral codes for this hackathon.
- **List Referrals**: `GET /referrals?opportunityId=...`
  - Individual breakdown of each referral code's performance.

### 4.2 Management
- **Create Referral**: `POST /referrals`
  - Body: `{ "opportunityId": "...", "code": "...", "rewardDetails": "..." }`
- **Referred Registrations**: `GET /referrals/:id/registrations`
  - List of users/teams who joined using a specific referral code.

---

## 5. Manage Roles (`/dashboard/hackathons/:slug/roles`)

Assigning team members to help with management or evaluation.

- **Get Roles**: `GET /hackathons/:id/roles`
  - Returns list of Owner, Managers, and Evaluators.
- **Add Role**: `POST /hackathons/:id/roles`
  - Body: `{ "email": "...", "role": "MANAGER" | "EVALUATOR" }`
- **Remove Role**: `DELETE /hackathons/:id/roles`
  - Body: `{ "email": "...", "role": "..." }`

---

## 6. Payments (`/dashboard/hackathons/:slug/payments`)

Financial oversight for paid hackathons.

- **Earnings Summary**: `GET /hackathons/:slug/earnings`
  - Net earnings, total share, and payout status.
- **Payments List**: `GET /hackathons/:slug/payments`
  - Individual transaction log for all registrations.

---

## 7. Send Notifications (`/dashboard/hackathons/:slug/notifications`)

Direct communication with participants.

- **Custom Team Email**: `POST /hackathons/:id/teams/:teamId/send-email`
  - Body: `{ "subject": "...", "body": "HTML content" }`
  - Broadcasts to all members of the specified team.

---

## 8. Settings (`/dashboard/hackathons/:slug/settings`)

Final platform configurations.

- **Lifecycle Management**: `PATCH /hackathons/:id/status`
  - Transition between `DRAFT`, `PUBLISHED`, `ONGOING`, `COMPLETED`.
- **Submit for Approval**: `POST /hackathons/:id/submit-for-approval`
  - Submits a DRAFT hackathon for admin review.
- **Capacity**: `PUT /hackathons/:id/max-teams`
  - Update the maximum number of teams allowed to register.
