# Referrals API

This guide covers how users generate referral links, track their clicks, and view their rewards.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Public Links and Tracking

These endpoints are used when a user clicks a referral link (often handled before they even log in).

### Validate a Code (`GET /referrals/public/resolve/:code`)
- **Usage:** Checks if a referral code is valid and returns who it belongs to.

### Track a Click (`POST /referrals/public/track-click`)
- **Usage:** Logs that someone clicked the link so the referrer can see their analytics.

---

## 2. The Referrer's Dashboard

These endpoints are for the logged-in user who is *sharing* their links.

### Generate a Link (`POST /referrals`)
- **Usage:** Creates a new referral code for the user to share.

### React Native Example (TanStack Query)
```typescript
const createReferral = useMutation({
  mutationFn: () => apiClient.request('/referrals', { method: 'POST' }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['referrals', 'performance'] });
  },
});
```

### View Performance (`GET /referrals/my/performance`)
- **Usage:** Returns total clicks, signups, and rewards earned.
- **React Native Example:**
  ```typescript
  const { data: performance } = useQuery({
    queryKey: ['referrals', 'performance'],
    queryFn: () => apiClient.request('/referrals/my/performance'),
  });
  ```

### List Referred Users (`GET /referrals/my/referred-users`)
- **Usage:** Lists the people who successfully signed up using this user's links.

---

## 3. Admin Tools
Admins can view platform-wide referral metrics using `GET /referrals/analytics` or look up a specific user's links with `GET /referrals/user-lookup`.
