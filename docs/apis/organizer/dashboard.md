# Dashboard Analytics API

This guide covers how to fetch analytics and metrics for the organizer dashboard.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Overall Dashboard Analytics

Fetch high-level stats across all the events and hackathons the organizer manages.

### Organizer Overview (`GET /analytics/organizer-stats`)

- **Usage:** Shows total participants, views, and impressions across all listings.
- **Parameters:** `period` (`today`, `this_week`, `this_month`, `all_time`) or custom `from`/`to` dates.
- **Returns:**
  ```json
  {
    "total_participants": 1250,
    "period_participants": 150,
    "total_opportunities": 12,
    "period_opportunities": 2,
    "total_views": 45000,
    "period_views": 3200,
    "total_impressions": 120000,
    "period_impressions": 8500,
    "hackathon": { "active": 3, "total": 5 },
    "event": { "active": 4, "total": 6 },
    "festival": { "active": 1, "total": 1 }
  }
  ```

### React Native Example (TanStack Query)

```typescript
const { data: stats } = useQuery({
  queryKey: ["organizer", "stats", period],
  queryFn: () =>
    apiClient.request(`/analytics/organizer-stats?period=${period}`),
  staleTime: 60000,
});
```

### Registration Trends (`GET /analytics/organizer-trends`)

- **Usage:** Shows daily registration counts and gender distribution to plot charts.
- **Returns:**
  ```json
  {
    "registrationTrend": [
      { "date": "01-05-2025", "events": 10, "hackathon": 5 }
    ],
    "genderTrend": [{ "date": "01-05-2025", "male": 8, "female": 7 }]
  }
  ```

---

## 2. Specific Opportunity Analytics

Get metrics for a single hackathon or event.

### General Stats

- **Endpoint:** `GET /analytics/{type}/:slug/general` (where `{type}` is `hackathon` or `event`)
- **Usage:** Fetches views, impressions, and total registrations for this specific listing.
- **Returns:**
  ```json
  {
    "registrations": 450,
    "periodRegistrations": 25,
    "views": "1200",
    "impressions": "5000"
  }
  ```

### Detailed Stats

- **Endpoint:** `GET /analytics/{type}/:slug/detailed`
- **Usage:** Fetches daily trends and demographic breakdowns for this specific listing.
- **Returns:**
  ```json
  {
    "registrations": [
      { "date": "01-05-2025", "men": 5, "women": 4, "other": 1 }
    ],
    "gender": {
      "male": 210,
      "female": 190,
      "other": 50
    }
  }
  ```

---

## 3. Performance Rankings

- **Top Listings:** `GET /analytics/organizer-top-listings` (Sorted by total registrations).
- **Highest Performing:** `GET /analytics/organizer-highest-performing` (Sorted by view-to-registration conversion rate).

---

## 4. Organizer Summary Analytics

Fetch modular, granular summaries across the organizer's active workspace.

### Registrations Summary (`GET /analytics/organizer/registrations-summary`)

- **Usage:** Shows a high-level registration breakdown (approved vs pending review) across all managed listings.
- **Returns:**
  ```json
  {
    "totalRegistrations": 250,
    "pendingReview": 45,
    "approved": 205
  }
  ```

### Opportunities Summary (`GET /analytics/organizer/opportunities-summary`)

- **Usage:** Returns the status breakdown of opportunities (drafts vs published) and average time elapsed between listing creation and approval.
- **Returns:**
  ```json
  {
    "draftsInProgress": 3,
    "readyToPublish": 9,
    "avgSetupTime": "2.4 days"
  }
  ```

### Payments Summary (`GET /analytics/organizer/payments-summary`)

- **Usage:** Shows financial performance metrics across paid registrations, including total revenue collected, payouts pending transfer, and refunds processed.
- **Returns:**
  ```json
  {
    "totalCollected": 45000,
    "pendingPayout": 8500,
    "refunds": 1200
  }
  ```

### Roles Summary (`GET /analytics/organizer/roles-summary`)

- **Usage:** Tracks organization scaling metrics: verified campus connections, assigned co-organizer/manager seats, and renewals due.
- **Returns:**
  ```json
  {
    "verifiedCampuses": 14,
    "adminSeats": 5,
    "renewalsDue": 0
  }
  ```

### Notifications Summary (`GET /analytics/organizer/notifications-summary`)

- **Usage:** Monitors bulk alert dispatch, tracking queued campaigns, successful deliveries today, and recipient open rates.
- **Returns:**
  ```json
  {
    "queuedAlerts": 2,
    "sentToday": 1500,
    "openRate": 0.0
  }
  ```

### Referrals Summary (`GET /analytics/organizer/referrals-summary`)

- **Usage:** Monitors active promotional campaigns, summarizing total tracking links created, successful registration conversions, and referral rewards disbursed.
- **Returns:**
  ```json
  {
    "totalReferrals": 45,
    "converted": 120,
    "rewardsIssued": 0
  }
  ```

### Pipeline Summary (`GET /analytics/organizer/pipeline-summary`)

- **Usage:** Tracks participant evaluation pipeline progression across rounds, indicating overall registrations, shortlisted contenders, and waitlist allocations.
- **Returns:**
  ```json
  {
    "totalRegistrations": 250,
    "shortlisted": 18,
    "waitlisted": 0
  }
  ```

### Settings Summary (`GET /analytics/organizer/settings-summary`)

- **Usage:** Summarizes active third-party workspace integrations (such as Google Sheets synchronization and Razorpay Route merchant setup) and registered staff size.
- **Returns:**
  ```json
  {
    "activeIntegrations": 2,
    "teamMembers": 4
  }
  ```

