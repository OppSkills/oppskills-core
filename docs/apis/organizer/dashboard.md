# Dashboard Analytics API

Reference for analytics and aggregated metrics used in the organizer dashboard. All endpoints require authentication and management permissions for the respective opportunities.

---

## 1. Overall Dashboard Analytics

Aggregated statistics for all opportunities owned or managed by the authenticated user.

### Organizer Overview (`GET /analytics/organizer-stats`)
**Method**: `GET`  
**Description**: Returns top-level metrics across all hackathons, events, and festivals.

**Query Parameters**:
- `period`: Filter by time range (`today`, `yesterday`, `this_week`, `this_month`, `this_year`, `all_time`).
- `from` / `to`: ISO date strings for custom ranges.

**Sample Response**:
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

### Registration Trends (`GET /analytics/organizer-trends`)
**Method**: `GET`  
**Description**: Returns time-series data for registrations and gender distribution.

**Sample Response**:
```json
{
  "registrationTrend": [
    { "date": "01-05-2025", "events": 10, "hackathon": 5 },
    { "date": "02-05-2025", "events": 12, "hackathon": 8 }
  ],
  "genderTrend": [
    { "date": "01-05-2025", "male": 8, "female": 7 },
    { "date": "02-05-2025", "male": 11, "female": 9 }
  ]
}
```

---

## 2. Specific Opportunity Analytics

Detailed metrics for a single hackathon or event, identified by its slug.

### General Stats (`GET /analytics/{type}/:slug/general`)
**Method**: `GET`  
**Description**: Fetches views, impressions, and registration totals for a specific opportunity.
**Types**: `hackathon` or `event`.

**Sample Response**:
```json
{
  "registrations": 450,
  "periodRegistrations": 25,
  "views": "1200",
  "impressions": "5000"
}
```

### Detailed Stats (`GET /analytics/{type}/:slug/detailed`)
**Method**: `GET`  
**Description**: Returns registration trends and demographic (gender) breakdown for a specific opportunity.

**Sample Response**:
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

### Top Listings (`GET /analytics/organizer-top-listings`)
**Method**: `GET`  
**Description**: Lists opportunities sorted by their total registration count.

### Highest Performing (`GET /analytics/organizer-highest-performing`)
**Method**: `GET`  
**Description**: Lists opportunities with the best view-to-registration conversion rates.
