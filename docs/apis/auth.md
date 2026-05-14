# Authentication API

Reference for authentication methods, sign-in/up flows, and token generation.

## Overview

OppSkills uses **Clerk** for identity management. Authentication is handled on the frontend via Clerk's UI components, and the backend verifies the resulting JWT (JSON Web Token) to authorize requests.

- **Base URL**: `http://localhost:3001` (Dev) / `https://api.oppskills.com` (Prod)
- **Auth Method**: `Bearer <clerk_jwt_token>`
- **Development Bypass**: In dev environments, use the `X-User-Id` header (see [Development Bypass](#development-auth-bypass)).

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

#### Client-Side (React Components)
Use the `useAuth` hook from `@clerk/nextjs`.

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
