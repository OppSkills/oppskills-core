# Core Data APIs

This document covers standalone API endpoints used across the platform for lookups, stats, waitlists, and integrations.

---

## 1. Colleges (`/colleges`)

These endpoints provide an autocomplete list of colleges to keep user profile data clean and consistent.

- **Search Colleges**
  - **Endpoint:** `GET /colleges/search?q=<search_string>`
  - **Usage:** Call this when a user types in a "College Name" input field.
  - **Response:** Returns an array of colleges (ID and Name) that match the search string.

- **Get Colleges by ID**
  - **Endpoint:** `GET /colleges/by-ids?ids=<id1>,<id2>`
  - **Usage:** Used to fetch the full college names when you only have their IDs saved in the database.

- **Bulk Import (Dev Only)**
  - **Endpoints:** `POST /colleges/bulk-import` and `POST /colleges/bulk-import-file`
  - **Usage:** Used locally by developers to seed the database with college lists. These are disabled in production.

---

## 2. Analytics (`/analytics`)

These endpoints provide the data required to render charts and metric cards on the Organizer Dashboard.

### Specific Event or Hackathon Stats

- **General Stats:**
  - `GET /analytics/event/:slug/general`
  - `GET /analytics/hackathon/:slug/general`
  - **Usage:** Fetches basic numbers like total page views and total registrations for a single listing.

- **Detailed Stats (Charts):**
  - `GET /analytics/event/:slug/detailed?period=30d&from=YYYY-MM-DD&to=YYYY-MM-DD`
  - `GET /analytics/hackathon/:slug/detailed?period=30d&from=YYYY-MM-DD&to=YYYY-MM-DD`
  - **Usage:** Fetches time-series data for line charts or bar graphs. You must provide `period`, `from`, and `to` query parameters.

### Global Organizer Stats (All listings combined)

- `GET /analytics/organizer-stats` - High-level metrics across all of the organizer's active listings.
- `GET /analytics/organizer-trends` - Time-series data for overall registration growth.
- `GET /analytics/organizer-top-listings` - A ranked list of the organizer's most popular events.
- `GET /analytics/organizer-highest-performing` - The single best-performing listing based on conversion rate.

---

## 3. Waitlist (`/waitlist`)

These endpoints allow users to express interest in upcoming features before they are built.

- **Join a Waitlist**
  - **Endpoint:** `POST /waitlist`
  - **Body:** `{ "feature": "skill-based-learning-tracks" }`
  - **Usage:** Adds the currently authenticated user to the waitlist for a specific feature.

- **Check Waitlist Status**
  - **Endpoint:** `GET /waitlist/:feature`
  - **Usage:** Checks if the currently authenticated user has already joined the waitlist for this feature, so you can update the UI (e.g., change the button from "Join Waitlist" to "Joined").

---

## 4. Google Sheets Integration (`/google-sheets`)

These endpoints are used internally to test and debug the automated Google Sheets export feature (which automatically syncs new registrations to an organizer's Google Sheet).

- **Check Connection:** `GET /google-sheets/status` and `GET /google-sheets/diagnostics`
  - **Usage:** Check if the OppSkills Google Service Account is correctly authenticated.
- **Test Row Insert:** `POST /google-sheets/test/append-row`
  - **Usage:** Test inserting dummy data into a target spreadsheet.
- **Check Headers:** `GET` / `POST /google-sheets/test/headers/:tabName`
  - **Usage:** Check or set the column headers in a specific tab.
- **Create Tab:** `POST /google-sheets/test/ensure-tab/:tabName`
  - **Usage:** Make sure a specific tab exists in the spreadsheet.
- **End-to-End Test:** `POST /google-sheets/test/registration`
  - **Usage:** Simulate a full end-to-end user registration syncing directly to the sheet.
