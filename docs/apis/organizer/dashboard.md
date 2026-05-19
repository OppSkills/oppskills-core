# Dashboard Analytics API

This guide covers how to fetch analytics and metrics for the organizer dashboard. 

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Overall Dashboard Analytics

Fetch high-level stats across all the events and hackathons the organizer manages.

### Organizer Overview (`GET /analytics/organizer-stats`)
- **Usage:** Shows total participants, views, and impressions across all listings.
- **Parameters:** `period` (`today`, `this_week`, `this_month`, `all_time`) or custom `from`/`to` dates.

### React Native Example (TanStack Query)
```typescript
const { data: stats } = useQuery({
  queryKey: ['organizer', 'stats', period],
  queryFn: () => apiClient.request(`/analytics/organizer-stats?period=${period}`),
  staleTime: 60000,
});
```

### Registration Trends (`GET /analytics/organizer-trends`)
- **Usage:** Shows daily registration counts and gender distribution to plot charts.

---

## 2. Specific Opportunity Analytics

Get metrics for a single hackathon or event.

### General Stats
- **Endpoint:** `GET /analytics/{type}/:slug/general` (where `{type}` is `hackathon` or `event`)
- **Usage:** Fetches views, impressions, and total registrations for this specific listing.

### Detailed Stats
- **Endpoint:** `GET /analytics/{type}/:slug/detailed`
- **Usage:** Fetches daily trends and demographic breakdowns for this specific listing.

---

## 3. Performance Rankings

- **Top Listings:** `GET /analytics/organizer-top-listings` (Sorted by total registrations).
- **Highest Performing:** `GET /analytics/organizer-highest-performing` (Sorted by view-to-registration conversion rate).
