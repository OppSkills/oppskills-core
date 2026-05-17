# User Profile API

API reference for endpoints related to user profile management, onboarding, and activity history.

For **step-by-step onboarding** (which route to call when, Clerk vs API, and exact `CreateOnboardingDto` rules), prefer **[Onboarding API](./onboarding.md)** and the **[Mobile API client guide](./mobile-client-guide.md)**.

## Profile Overview

The user profile contains:
1.  **Personal Info**: Name, Email, Category, Gender.
2.  **Education**: Institution details, graduation years, CGPA.
3.  **Preferences**: Skills and Interests.
4.  **Activity Stats**: Counts of registrations and participations.

---

## Basic Profile

### Get Current Session (`GET /user-accounts/me`)
**Method**: `GET`  
**Description**: Returns authenticated user profile and onboarding status. Used by the frontend to determine if the user needs to complete onboarding.

**Sample Response**:
```json
{
  "id": "user_2abc123",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "imageUrl": "https://img.clerk.com/...",
  "onboarded": true,
  "onboardingProfile": {
    "gender": "MALE",
    "userCategory": "COLLEGE_STUDENT",
    "college": {
      "id": "clx123...",
      "name": "IIT Bombay"
    }
  }
}
```

---

### Get Full Profile (`GET /user-accounts/profile`)
**Method**: `GET`  
**Description**: Returns comprehensive profile data including personal info, education, skills, interests, and stats.

**Sample Response**:
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "imageUrl": "https://...",
    "gender": "MALE",
    "userCategory": "COLLEGE_STUDENT"
  },
  "educationInfo": {
    "collegeId": "clx123...",
    "collegeName": "IIT Bombay",
    "course": "B.Tech",
    "courseSpecialization": "Computer Science",
    "startYear": "2021",
    "endYear": 2025,
    "rollNumber": "21CS1234",
    "cgpa": "9.2"
  },
  "skills": ["React", "TypeScript", "Node.js"],
  "interests": ["Hackathons", "Open Source", "AI/ML"],
  "stats": {
    "events": 3,
    "hackathon": 5,
    "certificates": 0
  }
}
```

---

## Profile Management

### Submit Onboarding (`PUT /user-accounts/onboarding`)
**Method**: `PUT`  
**Description**: Initializes or updates the onboarding profile. Sets the user status to onboarded.

**Sample Request Body** (see [Onboarding API](./onboarding.md) for full rules; `course` / `rollNumber` belong on **`PATCH /user-accounts/education`**, not on this DTO):

```json
{
  "gender": "MALE",
  "userCategory": "COLLEGE_STUDENT",
  "collegeId": "clx123...",
  "collegeCurrentYear": "3rd Year",
  "collegePassoutYear": 2025,
  "locationCity": "Mumbai",
  "locationState": "Maharashtra",
  "locationCountry": "India",
  "skills": ["React"],
  "interests": ["Web3"]
}
```

---

### Update Personal Info (`PATCH /user-accounts/profile`)
**Method**: `PATCH`  
**Description**: Updates name, gender, and user category.

**Sample Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "PREFER_NOT_TO_SAY",
  "userCategory": "WORKING_PROFESSIONAL"
}
```

---

### Update Education (`PATCH /user-accounts/education`)
**Method**: `PATCH`  
**Description**: Updates institutional details (School or College).

**Sample Request Body**:
```json
{
  "collegeId": "clx...",
  "course": "M.Tech",
  "courseSpecialization": "AI",
  "startYear": "2025",
  "endYear": 2027,
  "cgpa": "9.8"
}
```

---

### Update Skills (`PATCH /user-accounts/skills`)
**Method**: `PATCH`  
**Description**: Replaces the user skill list.

**Sample Request Body**:
```json
{
  "skills": ["Next.js", "TailwindCSS", "Prisma"]
}
```

---

### Update Interests (`PATCH /user-accounts/interests`)
**Method**: `PATCH`  
**Description**: Updates the user interest list.

**Sample Request Body**:
```json
{
  "interests": ["UI/UX Design", "Product Management"]
}
```

---

## Activity History

### My Registrations (`GET /user-accounts/registrations`)
**Method**: `GET`  
**Description**: Returns registered hackathons and events, sorted by date (descending).

**Sample Response**:
```json
[
  {
    "type": "HACKATHON",
    "id": "hack_123",
    "name": "Global AI Hackathon",
    "registrationDate": "2025-01-10T10:00:00Z",
    "status": "ONGOING"
  },
  {
    "type": "EVENT",
    "id": "event_456",
    "name": "React Meetup",
    "registrationDate": "2025-01-05T14:00:00Z",
    "status": "COMPLETED"
  }
]
```

---

### My Transactions (`GET /user-accounts/my-transactions`)
**Method**: `GET`  
**Description**: Returns payment history for registrations.

**Sample Response**:
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
