# Opportunities API

This guide covers how hackathons, events, and festivals are created, published, discovered, and joined.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Discovery and Search

These endpoints power the public pages where users find events.

### Search Everything (`GET /opportunity/search?q=<keyword>`)

- **Usage:** Returns a mix of matching hackathons and events, plus a top recommended section.
- **Returns:**
  ```json
  {
    "hackathons": [
      {
        "id": "hack_123",
        "name": "Global AI Hackathon",
        "slug": "global-ai-hackathon",
        "bannerImageUrl": "https://...",
        "startDate": "2025-03-15T10:00:00Z",
        "registrationDeadline": "2025-03-10T23:59:59Z",
        "locationAddress": "123 Tech St",
        "locationType": "PHYSICAL",
        "registrationCount": 45,
        "prizeTotalWorthAmount": "10000.00",
        "entryFeeAmount": "0.00",
        "isFree": true,
        "currency": "USD",
        "organizationName": "AI Labs",
        "lowestTicketPrice": null,
        "highestTicketPrice": null
      }
    ],
    "events": [],
    "topOpportunities": []
  }
  ```

### Search Suggestions (`GET /opportunity/autosuggest?q=<keyword>`)

- **Usage:** Used for fast dropdown suggestions. Strips description HTML.
- **Returns:**
  ```json
  [
    {
      "slug": "global-ai-hackathon",
      "type": "HACKATHON",
      "thumbnail": "https://...",
      "title": "Global AI Hackathon",
      "description": "An exciting competition focusing on generative AI..."
    }
  ]
  ```

### Fetching Details By Slug (`GET /hackathons/public/by-slug/:slug` or `/events/public/by-slug/:slug`)

- **Usage:** Fetch the full details of a specific hackathon or event.
- **React Native Example (TanStack Query):**
  ```typescript
  const { data: hackathon } = useQuery({
    queryKey: ["hackathon", slug],
    queryFn: () => apiClient.request(`/hackathons/public/by-slug/${slug}`),
    staleTime: 120000,
  });
  ```

---

## 2. Joining and Registration

How users sign up for an opportunity.

### Join an Event (`POST /events/:id/join`)

- **Usage:** Registers the user for an event. You must submit answers to their custom form if they have one.
- **Request Body:**
  ```json
  {
    "answers": [{ "fieldId": "field_1", "value": "My Answer" }],
    "referralCode": "optional_code"
  }
  ```
- **Returns:** `{ "success": true, "registrationId": "reg_abc123" }`

### Join a Hackathon (`POST /hackathons/:id/register`)

- **Usage:** Registers the user for a hackathon. Same payload structure as joining events if custom fields are required.
- **Returns:** `{ "success": true, "registrationId": "reg_xyz789" }`

### React Native Example

```typescript
const joinEvent = useMutation({
  mutationFn: (data) =>
    apiClient.request(`/events/${eventId}/join`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["registration", eventId] });
  },
});
```

---

## 3. Creation and Configuration (Organizers)

Organizers build their events step-by-step. All items start as a `DRAFT`.

### Create the Draft (`POST /hackathons` or `POST /events`)

- **Usage:** Initializes the draft opportunity.
- **Request Body:**
  ```json
  {
    "name": "Global AI Hackathon",
    "startDate": "2025-03-15T10:00:00Z",
    "endDate": "2025-03-17T18:00:00Z",
    "mode": "ONLINE", // "ONLINE", "OFFLINE", "HYBRID"
    "description": "Optional description text",
    "location": {
      "type": "VIRTUAL", // "PHYSICAL" or "VIRTUAL"
      "virtualLink": "https://meet.google.com/..."
    }
  }
  ```
- **Returns:** The newly created draft object containing its unique `id` and `slug`.

### Add Details (Module Updates)

Organizers update specific parts of their draft step-by-step before publishing:

- **Update Rounds:** `PUT /hackathons/:id/rounds`
- **Update Registration Form:** `PUT /hackathons/:id/registration-form`
- **Update Prize Breakdown:** `PUT /hackathons/:id/prize-breakdown`

### Publish

- **Submit for Approval:** `POST /hackathons/:id/submit-for-approval` (Requests admin review).
- **Manually Publish:** `PATCH /hackathons/:id/status` (If permissions allow direct publish).
  - **Request Body:** `{ "status": "PUBLISHED" }`
  - **Returns:** `{ "success": true, "status": "PUBLISHED" }`
