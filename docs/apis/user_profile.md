# User Profile API

This guide covers fetching a user's full profile and their registration history. 
Note: To update the profile, use the endpoints defined in the **[Onboarding API](./onboarding.md)**.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Fetching the Profile

### Get Current User (`GET /user-accounts/me`)
- **Usage:** Fetches the logged-in user. Use the `onboarded` boolean to decide if they need to be sent to the onboarding screens.
- **React Native Example:**
  ```typescript
  const { data: user } = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => apiClient.request('/user-accounts/me'),
    staleTime: 60000, 
  });
  ```

### Get Full Details (`GET /user-accounts/profile`)
- **Usage:** Fetches everything about the user (education, skills, interests, and participation stats) to display on their settings/profile screen.

---

## 2. Finding Other Users

### Search Users (`GET /user-accounts/search?q=<email>`)
- **Usage:** Finds users by their email. Organizers use this to invite co-managers to their events.

---

## 3. Activity History

### My Registrations (`GET /user-accounts/registrations`)
- **Usage:** Lists all the hackathons and events the user has joined, sorted by date.

### My Transactions (`GET /user-accounts/my-transactions`)
- **Usage:** Lists the user's payment history (receipts for tickets they bought).

### React Native Example
```typescript
const { data: history } = useQuery({
  queryKey: ['user', 'registrations'],
  queryFn: () => apiClient.request('/user-accounts/registrations'),
});
```
