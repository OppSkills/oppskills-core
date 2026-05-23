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
