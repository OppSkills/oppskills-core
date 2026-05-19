# Authentication API

This guide explains how authentication works in OppSkills and how to implement it in web and mobile apps. 

## Overview

OppSkills uses **Clerk** for all user authentication.
- **Frontend (Web/Mobile)**: Handles sign up, login, password reset, and social logins via Clerk SDKs.
- **Backend (API)**: Does not handle passwords or login directly. It only verifies the Clerk JWT token sent by the frontend.

**Important Details:**
- **Base API URL**: `http://localhost:3001` (Dev) / `https://api.oppskills.com` (Prod)
- **Authentication Header**: `Authorization: Bearer <your_clerk_token>`

---

## 1. Web Application (Next.js)

### UI Components (Sign In / Sign Up)
Use Clerk's pre-built components for the easiest setup.

```tsx
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <nav>
      <SignedOut>
        {/* Shows when user is logged out */}
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </SignedOut>
      <SignedIn>
        {/* Shows when user is logged in */}
        <UserButton />
      </SignedIn>
    </nav>
  );
}
```

### Making API Calls (Client Components)
Use the `useAuth` hook to get the token before making an API request.

```typescript
import { useAuth } from "@clerk/nextjs";

export function useMyData() {
  const { getToken } = useAuth();

  const fetchMyData = async () => {
    const token = await getToken(); 
    
    const response = await fetch("http://localhost:3001/hackathons/my", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    return response.json();
  };

  return { fetchMyData };
}
```

### Making API Calls (Server Components / Actions)
Use the `auth()` helper to get the token on the server.

```typescript
import { auth } from "@clerk/nextjs/server";

export async function fetchServerData() {
  const { getToken } = await auth();
  const token = await getToken();
  
  const response = await fetch("http://localhost:3001/hackathons/my", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
  return response.json();
}
```

---

## 2. Mobile Application (React Native / Expo)

### UI Components (Sign In / Sign Up)
- **Google Login**: Use Clerk’s OAuth flow for Expo.
- **Email + Password**: Use Clerk’s `useSignUp` and `useSignIn` hooks.

### Making API Calls
Use the `@clerk/clerk-expo` package to get the token. It is best practice to wrap this in a custom hook.

```tsx
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

export function useProtectedApi() {
  const { getToken, isSignedIn } = useAuth();
  const [data, setData] = useState<any>(null);

  const fetchMyHackathons = useCallback(async () => {
    if (!isSignedIn) {
      Alert.alert('Error', 'You must be signed in.');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch('https://api.oppskills.com/hackathons/my', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) throw new Error('API request failed');
      
      const json = await response.json();
      setData(json);
    } catch (error) {
      console.error(error);
    }
  }, [getToken, isSignedIn]);

  return { fetchMyHackathons, data };
}
```

---

## 3. Password Reset Flow (Forgot Password)

If you need to build a custom "Forgot Password" screen, use a two-step flow with Clerk's `useSignIn` hook.

### Step 1: Send the Code
Send a 6-digit verification code to the user's email.

```typescript
import { useSignIn } from "@clerk/nextjs"; // Use @clerk/clerk-expo for React Native

const { signIn } = useSignIn();

const sendCode = async (email: string) => {
  await signIn.create({
    strategy: "reset_password_email_code",
    identifier: email,
  });
};
```

### Step 2: Verify Code and Set New Password
Pass the code and the new password to complete the reset. This automatically logs the user in.

```typescript
import { useSignIn } from "@clerk/nextjs";

const { signIn, setActive } = useSignIn();

const resetPassword = async (code: string, newPassword: string) => {
  const result = await signIn.attemptFirstFactor({
    strategy: "reset_password_email_code",
    code: code,
    password: newPassword,
  });

  if (result.status === "complete") {
    // Log the user in with the new session
    await setActive({ session: result.createdSessionId });
  }
};
```

---

## 4. Manual API Testing (Postman / cURL)

To test the backend API manually:
1. Open your frontend dev server in the browser (e.g., `localhost:3000`).
2. Log in.
3. Open the browser console (F12) and run:
   ```javascript
   await window.Clerk.session.getToken()
   ```
4. Copy the output string and use it in Postman or cURL as the `Authorization: Bearer <token>` header.

---

## 5. Development Bypass (Local Testing Without Clerk)

For quick backend testing without needing a real Clerk token, you can bypass authentication.

1. Set `AUTH_BYPASS=true` in your backend `.env.local` file.
2. Send requests with these headers instead of a Bearer token:
   ```http
   X-User-Id: dev-user-001
   X-User-Email: dev@oppskills.com
   ```
*Note: This only works in development. It is fully disabled in production.*

---

## 6. Infrastructure & Admin Auth

- **Clerk Webhooks (`POST /user-accounts/clerk-webhook`)**: The backend listens to Clerk webhooks to keep the local database in sync when a user signs up or updates their profile.
- **Admin Auth**: Platform administrators do not use Clerk. They use a separate internal JWT system (`POST /admin/login`). See `admin.md` for details.
