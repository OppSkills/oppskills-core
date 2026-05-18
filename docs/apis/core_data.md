# Core Data and Integrations API

API reference for miscellaneous and foundational endpoints, including colleges lookup, waitlist signups, organizer analytics, and third-party integrations like Google Sheets.

## Overview

These endpoints support auxiliary features across the platform, primarily used during onboarding, pre-launch phases, and organizer dashboards.

---

## 1. Colleges (`/colleges`)

Used in the user profile onboarding flow to standardise institutional data.

- **Search Colleges**: `GET /colleges/search?q=...`
  - Returns a list of matching college names and IDs.
- **Get Colleges By ID**: `GET /colleges/by-ids?ids=id1,id2`
  - Returns full college details for an array of comma-separated IDs.
- **Bulk Import (Dev-Only)**: `POST /colleges/bulk-import` and `POST /colleges/bulk-import-file` (Blocked in production).

---

## 2. Analytics (`/analytics`)

Used to render charts and key metrics on the Organizer Dashboard.

### Event & Hackathon Specific
- **General Stats**: `GET /analytics/event/:slug/general` / `GET /analytics/hackathon/:slug/general`
- **Detailed Stats**: `GET /analytics/event/:slug/detailed` / `GET /analytics/hackathon/:slug/detailed`
  - Requires query params: `period`, `from`, `to`

### Global Organizer Stats
- **Aggregate Metrics**: `GET /analytics/organizer-stats`
- **Registration Trends**: `GET /analytics/organizer-trends`
- **Top Listings**: `GET /analytics/organizer-top-listings`
- **Highest Performing**: `GET /analytics/organizer-highest-performing`

---

## 3. Waitlist (`/waitlist`)

Used for capturing leads before a feature is publicly available.

- **Join Waitlist**: `POST /waitlist`
  - Body: `{ "feature": "skill-based-learning-tracks" }`
- **Check Status**: `GET /waitlist/:feature`
  - Returns whether the authenticated user is already on the list.

---

## 4. Google Sheets Integration (`/google-sheets`)

Endpoints for validating and testing the Google Sheets service account integration.

- **Status & Diagnostics**: `GET /google-sheets/status` and `GET /google-sheets/diagnostics`
- **Test Row Append**: `POST /google-sheets/test/append-row`
- **Test Headers Management**: `GET /google-sheets/test/headers/:tabName` and `POST /google-sheets/test/headers/:tabName`
- **Ensure Tab Exists**: `POST /google-sheets/test/ensure-tab/:tabName`
- **Test Registration Flow**: `POST /google-sheets/test/registration`
