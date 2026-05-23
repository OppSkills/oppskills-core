# User Profile API

This guide covers fetching a user's full profile and their registration history.
Note: To update the profile, use the endpoints defined in the **[Onboarding API](./onboarding.md)**.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Fetching the Profile

### Get Current User (`GET /user-accounts/me`)

- **Usage:** Fetches the logged-in user. Use the `onboarded` boolean to decide if they need to be sent to the onboarding screens.
- **Returns:**
  ```json
  {
    "id": "user_123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "imageUrl": "https://img.clerk.com/...",
    "onboarded": true,
    "onboardingProfile": {
      "gender": "MALE",
      "userCategory": "COLLEGE_STUDENT",
      "college": { "id": "clx123", "name": "IIT Bombay" }
    }
  }
  ```

### React Native Example

```typescript
const { data: user } = useQuery({
  queryKey: queryKeys.me,
  queryFn: () => apiClient.request("/user-accounts/me"),
  staleTime: 60000,
});
```

### Get Full Details (`GET /user-accounts/profile`)

- **Usage:** Fetches everything about the user (education, skills, interests, and participation stats) to display on their settings/profile screen.
- **Returns:**
  ```json
  {
    "personalInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "user@example.com",
      "imageUrl": "https://...",
      "gender": "MALE",
      "userCategory": "COLLEGE_STUDENT"
    },
    "educationInfo": {
      "collegeName": "IIT Bombay",
      "course": "B.Tech",
      "courseSpecialization": "Computer Science",
      "startYear": "2021",
      "endYear": 2025,
      "cgpa": "9.2"
    },
    "skills": ["React", "TypeScript"],
    "interests": ["Hackathons"],
    "stats": {
      "events": 3,
      "hackathon": 5,
      "certificates": 0
    }
  }
  ```

---

## 2. Finding Other Users

### Search Users (`GET /user-accounts/search?q=<email>`)

- **Usage:** Finds users by their email. Organizers use this to invite co-managers to their events.
- **Returns:** An array of users:
  ```json
  [
    {
      "id": "user_2abc123",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "imageUrl": "https://..."
    }
  ]
  ```

---

## 3. Activity History

### My Registrations (`GET /user-accounts/registrations`)

- **Usage:** Lists all the hackathons and events the user has joined, sorted by date.
- **Returns:**
  ```json
  [
    {
      "type": "HACKATHON",
      "id": "hack_123",
      "name": "Global AI Hackathon",
      "registrationDate": "2025-01-10T10:00:00Z",
      "status": "ONGOING"
    }
  ]
  ```

### My Transactions (`GET /user-accounts/my-transactions`)

- **Usage:** Lists the user's payment history (receipts for tickets they bought).
- **Returns:**
  ```json
  [
    {
      "id": "pay_abc123",
      "amount": 500,
      "currency": "INR",
      "status": "CAPTURED",
      "purpose": "Registration Fee - AI Hackathon",
      "date": "2025-01-10T10:05:00Z"
    }
  ]
  ```

### React Native Example

```typescript
const { data: history } = useQuery({
  queryKey: ["user", "registrations"],
  queryFn: () => apiClient.request("/user-accounts/registrations"),
});
```
