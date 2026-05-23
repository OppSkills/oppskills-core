# Referrals API

This guide covers how users generate referral links, track their clicks, and view their rewards.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Public Links and Tracking

These endpoints are used when a user clicks a referral link (often handled before they even log in).

### Validate a Code (`GET /referrals/public/resolve/:code`)

- **Usage:** Checks if a referral code is valid and returns who it belongs to.
- **Returns:** Information about the referrer and the target opportunity (e.g., `hackathonId`, `eventName`) so you can redirect the user appropriately.

### Track a Click (`POST /referrals/public/track-click`)

- **Usage:** Logs that someone clicked the link so the referrer can see their analytics. Call this as soon as the app/website opens with a referral code in the URL.
- **Request Body:**
  ```json
  {
    "code": "REF_XYZ123",
    "source": "https://twitter.com/..." // (Optional) The URL where the click originated
  }
  ```
- **Returns:** `{ "success": true }`

---

## 2. The Referrer's Dashboard

These endpoints are for the logged-in user who is _sharing_ their links. Or for organizers creating links for users.

### Generate a Link (`POST /referrals`)

- **Usage:** Creates a new referral code assigned to a specific user for a specific opportunity.
- **Request Body:**
  ```json
  {
    "entityType": "HACKATHON", // "HACKATHON", "EVENT", or "FESTIVAL"
    "entityId": "hack_123", // The ID of the specific event
    "referrerEmail": "john@example.com", // The existing user who will own this code
    "sendEmail": true // (Optional) If true, emails the generated code to the referrer
  }
  ```
- **Returns:** The newly created referral object, including the generated `code` string.

### React Native Example (TanStack Query)

```typescript
const createReferral = useMutation({
  mutationFn: (data) =>
    apiClient.request("/referrals", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["referrals", "performance"] });
  },
});
```

### View Performance (`GET /referrals/my/performance`)

- **Usage:** Returns total clicks, signups, and rewards earned for the current user.
- **Returns:**
  ```json
  {
    "totalClicks": 150,
    "humanClicks": 120,
    "referredParticipants": 15,
    "totalRegistrations": 10,
    "linksGenerated": 3
  }
  ```

### List Referred Users (`GET /referrals/my/referred-users`)

- **Usage:** Lists the people who successfully signed up using this user's links.
- **Returns:** An array of `ReferredRegistrationDto` objects (contains `name`, `email`, `registrationDate`, and `status`).

---

## 3. Admin Tools

Admins can view platform-wide referral metrics using `GET /referrals/analytics` or look up a specific user's links with `GET /referrals/user-lookup`.
