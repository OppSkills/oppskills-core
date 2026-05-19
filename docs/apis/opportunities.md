# Opportunities API

This guide covers how hackathons, events, and festivals are created, published, discovered, and joined.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Discovery and Search

These endpoints power the public pages where users find events.

- **Search Everything:** `GET /opportunity/search?q=<keyword>` (Returns a mix of events and hackathons).
- **Search Suggestions:** `GET /opportunity/autosuggest?q=<keyword>` (Used for quick dropdowns).
- **List Hackathons:** `GET /hackathons/public`
- **List Events:** `GET /events/public`
- **Upcoming Items:** `GET /hackathons/public/upcoming` or `GET /events/public/upcoming`

### Fetching Details
- **By Slug:** `GET /hackathons/public/by-slug/:slug` (or `/events/...`)
- **React Native Example (TanStack Query):**
  ```typescript
  const { data: hackathon } = useQuery({
    queryKey: ['hackathon', slug],
    queryFn: () => apiClient.request(`/hackathons/public/by-slug/${slug}`),
    staleTime: 120000, 
  });
  ```

---

## 2. Joining and Registration

How users sign up for an opportunity.

### Join an Event (`POST /events/:id/join`)
- **Usage:** Registers the user for an event. You must submit answers to their custom form if they have one.
- **Body:**
  ```json
  {
    "answers": [{ "fieldId": "field_1", "value": "My Answer" }],
    "referralCode": "optional_code"
  }
  ```

### Join a Hackathon (`POST /hackathons/:id/register`)
- **Usage:** Registers the user for a hackathon.

### React Native Example
```typescript
const joinEvent = useMutation({
  mutationFn: (data) => apiClient.request(`/events/${eventId}/join`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  onSuccess: () => {
    // Refresh registration status so UI shows "Registered"
    queryClient.invalidateQueries({ queryKey: ['registration', eventId] });
  },
});
```

---

## 3. Creation and Configuration (Organizers)

Organizers build their events step-by-step. All items start as a `DRAFT`.

1. **Create the Draft:** `POST /hackathons` or `POST /events`
   - *Requires:* `name`, `startDate`, `endDate`, `mode` ("ONLINE", "OFFLINE", "HYBRID").
2. **Add Details (Module Updates):**
   - `PUT /hackathons/:id/rounds`
   - `PUT /hackathons/:id/registration-form`
   - `PUT /hackathons/:id/prize-breakdown`
3. **Publish:**
   - Submit for approval: `POST /hackathons/:id/submit-for-approval`
   - Or manually publish (if allowed): `PATCH /hackathons/:id/status`
