# Festival Organizer API

This guide covers how organizers manage festivals (which are collections of multiple events and hackathons).

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Dashboard & Detail

### List My Festivals (`GET /festivals/my`)

- **Usage:** Fetches all festivals the user manages.
- **Returns:**
  ```json
  [
    {
      "id": "fest_123",
      "name": "Summer Tech Fest 2025",
      "slug": "summer-tech-fest",
      "startDate": "2025-06-01T09:00:00Z",
      "endDate": "2025-06-05T18:00:00Z",
      "status": "PUBLISHED"
    }
  ]
  ```

### Get Festival Details (`GET /festivals/:id`)

- **Usage:** Fetches the metadata, location, and the list of associated hackathons/events.
- **Returns:**
  ```json
  {
    "id": "fest_123",
    "name": "Summer Tech Fest 2025",
    "slug": "summer-tech-fest",
    "startDate": "2025-06-01T09:00:00Z",
    "endDate": "2025-06-05T18:00:00Z",
    "status": "PUBLISHED",
    "eventsCount": 4,
    "hackathonsCount": 2
  }
  ```

### React Native Example (TanStack Query)

```typescript
const { data: festival } = useQuery({
  queryKey: ["festival", festivalId],
  queryFn: () => apiClient.request(`/festivals/${festivalId}`),
});
```

---

## 2. Content Management

Festivals are containers. You can list what is inside them.

- **List Hackathons in Festival:** `GET /festivals/:id/hackathons`
  - Returns an array of hackathons associated with the festival ID.

---

## 3. Editing & Lifecycle

- **Update Basic Info:** `PUT /festivals/:id`
  - **Request Body:**
    ```json
    {
      "name": "Updated Festival Name",
      "startDate": "2025-06-01T10:00:00Z",
      "endDate": "2025-06-05T19:00:00Z"
    }
    ```
- **Update Status:** `PATCH /festivals/:id/status` (Changes state between `DRAFT`, `PUBLISHED`, `COMPLETED`, etc.).
  - **Request Body:** `{ "status": "PUBLISHED" }`
- **Delete Festival:** `DELETE /festivals/:id` (Soft deletes the festival).

### React Native Example

```typescript
const updateStatus = useMutation({
  mutationFn: (newStatus) =>
    apiClient.request(`/festivals/${festivalId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["festival", festivalId] });
  },
});
```
