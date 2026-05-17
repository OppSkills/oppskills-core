# Authentication API

Reference for authentication methods, sign-in/up flows, and token generation.

## Related guides

- **[Mobile API client guide](./mobile-client-guide.md)** — Read this first for React Native: TanStack Query, a shared API client, caching, and auth-gated navigation.
- **[Onboarding API](./onboarding.md)** — Backend onboarding DTOs and user-account routes (Clerk vs OppSkills).

## Overview

OppSkills uses **Clerk** for identity management. Authentication is handled on the **client** (web or mobile) via Clerk; the **backend** only verifies the short-lived **Clerk JWT** on each request. There are **no** first-party REST endpoints for “send signup OTP” or “verify email code” — those flows are implemented with **Clerk** (email verification, OAuth, password reset, and so on).

- **Base URL**: `http://localhost:3001` (Dev) / `https://api.oppskills.com` (Prod)
- **Auth Method**: `Bearer <clerk_jwt_token>`
- **Development Bypass**: In dev environments, use the `X-User-Id` header (see [Development Bypass](#development-auth-bypass)).

---

## React Native (Expo) — tokens and API calls

Use **`@clerk/clerk-expo`** (or the current Clerk Expo SDK recommended in Clerk’s own docs for your SDK version). The same backend rule applies as on web: send the session JWT on every protected request.

### Retrieving a JWT in a component

```tsx
import { useAuth } from '@clerk/clerk-expo';

function useOppskillsRequest() {
  const { getToken, isSignedIn } = useAuth();

  return async function oppskillsFetch(path: string, init: RequestInit = {}) {
    if (!isSignedIn) {
      throw new Error('Not signed in');
    }
    const token = await getToken();
    if (!token) {
      throw new Error('Missing Clerk token');
    }

    const base = process.env.EXPO_PUBLIC_API_BASE_URL!;
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');
    if (init.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return fetch(`${base}${path}`, { ...init, headers });
  };
}
```

### Google sign-in and email / password

- **Google**: Use Clerk’s **OAuth** flow for Expo (Google provider configured in the Clerk dashboard). After success, `getToken()` works the same way.
- **Email + password**: Use Clerk’s **`useSignUp` / `useSignIn`** hooks with the `password` strategy. If your product shows an **email verification code** step, that verification is performed **against Clerk**, not against OppSkills.

After the user has an active Clerk session, load app state from the API with e.g. **`GET /user-accounts/me`** (see [Onboarding API](./onboarding.md)).

### Password reset on mobile

The [Password Reset Flow](#password-reset-flow-forgot-password) below uses `@clerk/nextjs`. On Expo, use the **equivalent Clerk Expo hooks** (`useSignIn`, `setActive`, and so on) with the same strategies (`reset_password_email_code`). The sequence (request code → attempt factor with code + new password) is identical; only the import path changes.

---

## Authentication Flow

### 1. User Sign In / Sign Up
Users must authenticate through the frontend application. We use Clerk's pre-built components for a secure and seamless experience.

**Frontend Implementation Example:**
```tsx
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export function Navbar() {
  return (
    <nav>
      <SignedOut>
        {/* Users can sign in or sign up via modals or redirects */}
        <SignInButton mode="modal" />
        <SignUpButton mode="modal" />
      </SignedOut>
      <SignedIn>
        <UserButton />
      </SignedIn>
    </nav>
  );
}
```

### 2. Generating a JWT Token
To call protected backend endpoints, the frontend must retrieve a short-lived JWT from Clerk.

#### Client-Side (Next.js)

Use the `useAuth` hook from `@clerk/nextjs`. For **Expo**, use the [React Native (Expo)](#react-native-expo--tokens-and-api-calls) section above instead of this snippet.

```typescript
import { useAuth } from "@clerk/nextjs";

const { getToken } = useAuth();

const callProtectedApi = async () => {
  // getToken() fetches a valid JWT (refreshes automatically if expired)
  const token = await getToken(); 
  
  const response = await fetch("http://localhost:3001/hackathons/my", {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });
};
```

#### Server-Side (Next.js Server Components / Actions)
Use the `auth()` helper from `@clerk/nextjs/server`.

```typescript
import { auth } from "@clerk/nextjs/server";

export async function MyServerAction() {
  const { getToken } = await auth();
  const token = await getToken();
  
  // Use token for backend fetch...
}
```

### 3. API Testing (Manual Token Retrieval)
If you need to test the API via **Postman** or **cURL**, you can extract a token from your browser while logged into the dev environment:

1. Open the browser console (F12) on `localhost:3000`.
2. Run: `await window.Clerk.session.getToken()`
3. Copy the string and use it in your `Authorization` header as `Bearer <token>`.

---

## Password Reset Flow (Forgot Password)

For users who have forgotten their password, OppSkills implements a custom two-step reset flow using Clerk's `signIn` methods.

### 1. Requesting a Reset Code
The first step is to initiate a sign-in attempt specifically for password reset. This sends a 6-digit verification code to the user's email.

```typescript
import { useSignIn } from "@clerk/nextjs";

const { signIn } = useSignIn();

const handleSendResetCode = async (email: string) => {
  await signIn.create({
    strategy: "reset_password_email_code",
    identifier: email,
  });
  // Inform user that code has been sent
};
```

### 2. Verifying Code and Setting New Password
Once the user receives the code, they must provide it along with their new password to complete the reset and sign in.

```typescript
const handleResetPassword = async (code: string, newPassword: string) => {
  const result = await signIn.attemptFirstFactor({
    strategy: "reset_password_email_code",
    code: code,
    password: newPassword,
  });

  if (result.status === "complete") {
    // User is now signed in with the new password
    await setActive({ session: result.createdSessionId });
  }
};
```

**Implementation Notes:**
- **Error Handling**: Use `getClerkErrorMessage(error)` to display meaningful feedback (e.g., "The verification code is incorrect").
- **Security**: This flow automatically signs the user in upon successful reset.
- **UX**: Always provide a way for the user to navigate back to the standard Sign In form.

---

## Infrastructure

### Clerk Webhook (`POST /user-accounts/clerk-webhook`)

Syncs user lifecycle events (Create, Update, Delete) from Clerk to the local database. This ensures that when a user signs up via Clerk, they immediately exist in the OppSkills database with the correct metadata.

**Headers:**
- `svix-id`, `svix-timestamp`, `svix-signature`: Required for verification.

**Body**: Clerk Webhook Payload (JSON)

---

## Development Auth Bypass

Local testing without Clerk tokens can be enabled by setting `AUTH_BYPASS=true` in `.env.local` for the backend.

**Headers:**
```http
X-User-Id: dev-user-001
X-User-Email: dev@oppskills.com
```

**Note**: This bypass only works in `development` or `test` environments. It is strictly disabled in production.
