# Teams API

This guide covers how users create, join, and manage teams for hackathons.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Creating and Joining

### Create a Team (`POST /hackathons/create-team`)
- **Usage:** Creates a new team and makes the current user the leader.
- **Request Body:** 
  ```json
  { 
    "hackathonId": "hack_123", 
    "teamName": "Byte Busters" 
  }
  ```
- **Returns:** The created team object, including the `id` and `inviteCode`.

### React Native Example (TanStack Query)
```typescript
const createTeam = useMutation({
  mutationFn: (data) => apiClient.request('/hackathons/create-team', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['my-team', hackathonId] });
  },
});
```

### Join an Existing Team (`POST /hackathons/join-team`)
- **Usage:** Adds the user to an existing team.
- **Request Body:** 
  ```json
  { 
    "teamId": "team_abc", 
    "inviteCode": "XYZ789" 
  }
  ```
- **Returns:** `{ "success": true }`

---

## 2. Viewing Teams

- **Get My Team:** `GET /hackathons/my-team` (Fetches the user's current team).
  - **Returns:**
    ```json
    {
      "id": "team_abc",
      "name": "Byte Busters",
      "inviteCode": "XYZ789",
      "leaderId": "user_123",
      "members": [
        { "id": "user_123", "name": "John Doe", "role": "LEADER" }
      ]
    }
    ```
- **Get Specific Team:** `GET /hackathons/team/:teamId` (Gets team members and details).
- **List All Teams (Leaderboard):** `GET /hackathons/teams/:hackathonId`

### React Native Example
```typescript
const { data: myTeam } = useQuery({
  queryKey: ['my-team', hackathonId],
  queryFn: () => apiClient.request(`/hackathons/my-team?hackathonId=${hackathonId}`),
});
```

---

## 3. Team Management

- **Leave Team:** `DELETE /hackathons/leave-team/:teamId` (If the leader leaves, they must assign a new leader or the team dissolves if empty).
- **Kick Member:** `DELETE /hackathons/leave-team/:teamId/member/:userId` (Leader only).
- **Change Leader:** `PATCH /hackathons/team/:teamId/leader` (Body: `{ "newLeaderId": "user_456" }`).

---

## 4. Checkout / Draft Teams

When users pay for a team ticket, they build a "draft" team first before they are officially registered.
- **Draft Endpoints:** `POST /hackathons/:slug/teams/draft`, `POST .../draft/join`, `DELETE .../draft/leave`.
