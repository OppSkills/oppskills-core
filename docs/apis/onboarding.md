# Onboarding API

This guide explains how to complete a user's profile during the onboarding flow.

For mobile (React Native) integrations, use the `apiClient.request` and TanStack Query patterns from the `mobile-client-guide.md`.

---

## 1. Complete Onboarding (`PUT /user-accounts/onboarding`)

- **Usage:** Call this when the user finishes the mandatory onboarding steps. This sets `onboarded = true` so they can access the rest of the app.
- **Rules:** The fields you must send depend on the `userCategory`.
  - `SCHOOL_STUDENT` needs `schoolName` and `schoolClass`.
  - `COLLEGE_STUDENT` needs `collegeId` or `collegeName` (unless `collegeSkipped` is true).

### React Native Example (TanStack Query)

```typescript
const submitOnboarding = useMutation({
  mutationFn: (data) =>
    apiClient.request("/user-accounts/onboarding", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  onSuccess: () => {
    // Refresh the user profile so the app knows they are onboarded
    queryClient.invalidateQueries({ queryKey: queryKeys.me });
  },
});
```

### Full Payload Example

```json
{
  "gender": "MALE", // MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY
  "userCategory": "COLLEGE_STUDENT", // SCHOOL_STUDENT, COLLEGE_STUDENT, WORKING_PROFESSIONAL, FRESHER
  "mobileNumber": "+919876543210",
  "collegeId": "clx123",
  "collegeCurrentYear": "3rd Year",
  "collegePassoutYear": 2026,
  "collegeSkipped": false,
  "locationCity": "Mumbai",
  "locationState": "Maharashtra",
  "locationCountry": "India",
  "skills": ["React"],
  "interests": ["Hackathons"],
  "experienceLevel": "INTERMEDIATE", // BEGINNER, INTERMEDIATE, ADVANCED, EXPERT
  "teamPreference": "OPEN_TO_EITHER" // LOOKING_FOR_TEAM, HAVE_TEAM, PREFER_SOLO
}
```

---

## 2. Partial Profile Updates

You can update specific sections of a user's profile at any time.

### Update Basic Info (`PATCH /user-accounts/profile`)

- **Usage:** Update names, gender, or category.
- **Body:** `{ "firstName": "John", "lastName": "Doe", "gender": "MALE" }`

### Update Education (`PATCH /user-accounts/education`)

- **Usage:** Update college, course, or grades.
- **Body:**
  ```json
  {
    "collegeId": "clx123",
    "course": "B.Tech",
    "courseSpecialization": "Computer Science",
    "startYear": "2022",
    "endYear": 2026,
    "rollNumber": "22CS1001",
    "cgpa": "8.5"
  }
  ```

### Update Skills or Interests

- **Skills:** `PATCH /user-accounts/skills` -> `{ "skills": ["React", "TypeScript"] }`
- **Interests:** `PATCH /user-accounts/interests` -> `{ "interests": ["Open Source"] }`

---

## 3. Getting the Profile

### Fetch Current User (`GET /user-accounts/me`)

- **Usage:** The first thing your app should do after login. It returns `onboarded` (true/false) to help you route the user.
- **React Native Example:**
  ```typescript
  const { data: user } = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => apiClient.request("/user-accounts/me"),
    staleTime: 60000,
  });
  ```

### Search Colleges (`GET /colleges/search?q=...`)

- **Usage:** Powers the autocomplete dropdown when users search for their college during onboarding.
