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

## 1. Sign Up Flow (Email + Password + Verification OTP)

To sign up a user with email and password, you must capture their details, register them with Clerk, send a verification email with a 6-digit OTP code, and verify it.

### Web (Next.js Component / Custom Flow)

You can use the default Clerk `<SignUp />` component or create a custom form using `useSignUp()`.

### Mobile (React Native / Expo Custom Flow)

```tsx
import * as React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSignUp } from "@clerk/clerk-expo";

export function SignUpScreen({
  onSignUpSuccess,
}: {
  onSignUpSuccess: () => void;
}) {
  const { isLoaded, signUp, setActive } = useSignUp();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");

  // 1. Submit email and password
  const onSignUpPress = async () => {
    if (!isLoaded) return;
    try {
      await signUp.create({ emailAddress, password });
      // Send the verification email code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  // 2. Verify the 6-digit OTP code sent to user email
  const onPressVerify = async () => {
    if (!isLoaded) return;
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });
      if (completeSignUp.status === "complete") {
        await setActive({ session: completeSignUp.createdSessionId });
        onSignUpSuccess();
      } else {
        console.error(JSON.stringify(completeSignUp, null, 2));
      }
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {!pendingVerification ? (
        <View>
          <TextInput
            autoCapitalize="none"
            placeholder="Email..."
            value={emailAddress}
            onChangeText={(email) => setEmailAddress(email)}
          />
          <TextInput
            placeholder="Password..."
            secureTextEntry={true}
            value={password}
            onChangeText={(pwd) => setPassword(pwd)}
          />
          <TouchableOpacity onPress={onSignUpPress}>
            <Text style={{ color: "blue", marginTop: 10 }}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TextInput
            placeholder="6-digit verification code..."
            value={code}
            onChangeText={(c) => setCode(c)}
          />
          <TouchableOpacity onPress={onPressVerify}>
            <Text style={{ color: "blue", marginTop: 10 }}>Verify Email</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

---

## 2. Sign In Flow (Email + Password)

### Mobile (React Native / Expo Custom Flow)

```tsx
import * as React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";

export function SignInScreen({
  onSignInSuccess,
}: {
  onSignInSuccess: () => void;
}) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");

  const onSignInPress = async () => {
    if (!isLoaded) return;
    try {
      const completeSignIn = await signIn.create({
        identifier: emailAddress,
        password,
      });
      // Set the active session and log the user in
      await setActive({ session: completeSignIn.createdSessionId });
      onSignInSuccess();
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        autoCapitalize="none"
        placeholder="Email..."
        value={emailAddress}
        onChangeText={(email) => setEmailAddress(email)}
      />
      <TextInput
        placeholder="Password..."
        secureTextEntry={true}
        value={password}
        onChangeText={(pwd) => setPassword(pwd)}
      />
      <TouchableOpacity onPress={onSignInPress}>
        <Text style={{ color: "blue", marginTop: 10 }}>Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 3. Social Logins (Google OAuth)

### Web (Next.js)

Simply render the `<SignInButton>` or call `signIn.authenticateWithRedirect()`:

```typescript
import { useSignIn } from "@clerk/nextjs";

export function SocialLoginButton() {
  const { signIn } = useSignIn();
  const loginWithGoogle = () => {
    signIn?.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/"
    });
  };
  return <button onClick={loginWithGoogle}>Google Login</button>;
}
```

### Mobile (React Native / Expo)

In React Native, OAuth requires opening the system browser using `expo-web-browser` and capturing the redirect URL.

```typescript
import React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Button } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';

// Warm up the browser on mobile before authentication starts
WebBrowser.maybeCompleteAuthSession();

export function GoogleLoginButton() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const onPressGoogleLogin = React.useCallback(async () => {
    try {
      const { createdSessionId, signIn, signUp, setActive } = await startOAuthFlow({
        redirectUrl: Linking.createURL('/oauth-callback', { scheme: 'oppskills' }),
      });

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      } else {
        // Use signIn or signUp for next steps such as MFA verification
      }
    } catch (err) {
      console.error('OAuth error: ', err);
    }
  }, []);

  return <Button title="Login with Google" onPress={onPressGoogleLogin} />;
}
```

---

## 4. Session & Signed-In User Management

### Checking & Monitoring Auth State

- On Web: Check status using Clerk’s `<SignedIn>` or `<SignedOut>` components, or the `useUser()` hook.
- On Mobile: Use the `useAuth()` or `useUser()` hooks to inspect if a session exists.

```typescript
import { useUser } from '@clerk/clerk-expo';
import { Text, View } from 'react-native';

export function ProfileHeader() {
  const { isSignedIn, user } = useUser();

  if (!isSignedIn || !user) return null;

  return (
    <View>
      <Text>Welcome back, {user.firstName || user.username}</Text>
      <Text>Primary Email: {user.primaryEmailAddress?.emailAddress}</Text>
    </View>
  );
}
```

### Sign Out / Log Out

```typescript
import { useAuth } from '@clerk/clerk-expo';
import { Button } from 'react-native';

export function LogoutButton() {
  const { signOut } = useAuth();
  return <Button title="Sign Out" onPress={() => signOut()} />;
}
```

---

## 5. Password Reset Flow (Forgot Password)

If a user forgets their password, they must enter their email, receive a 6-digit OTP code, verify it, and then submit a new password.

### Custom React Native Flow

```tsx
import * as React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSignIn } from "@clerk/clerk-expo";

export function ForgotPasswordScreen({
  onResetSuccess,
}: {
  onResetSuccess: () => void;
}) {
  const { isLoaded, signIn, setActive } = useSignIn();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [code, setCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [step, setStep] = React.useState(1); // 1 = Send Code, 2 = Verify & Reset

  // Step 1: Request a password reset code
  const onRequestCode = async () => {
    if (!isLoaded) return;
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: emailAddress,
      });
      setStep(2);
    } catch (err: any) {
      console.error(err.message);
    }
  };

  // Step 2: Submit the reset code and the new password
  const onSubmitNewPassword = async () => {
    if (!isLoaded) return;
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete") {
        // Login the user with the new session
        await setActive({ session: result.createdSessionId });
        onResetSuccess();
      } else {
        console.error(result);
      }
    } catch (err: any) {
      console.error(err.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {step === 1 ? (
        <View>
          <TextInput
            autoCapitalize="none"
            placeholder="Enter your email..."
            value={emailAddress}
            onChangeText={setEmailAddress}
          />
          <TouchableOpacity onPress={onRequestCode}>
            <Text style={{ color: "blue", marginTop: 10 }}>
              Send Reset Code
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TextInput
            placeholder="Enter the 6-digit code..."
            value={code}
            onChangeText={setCode}
          />
          <TextInput
            placeholder="New Password..."
            secureTextEntry={true}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={onSubmitNewPassword}>
            <Text style={{ color: "blue", marginTop: 10 }}>
              Reset Password & Log In
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
```

---

## 6. Manual API Testing (Postman / cURL)

To test the backend API manually:

1. Open your frontend dev server in the browser (e.g., `localhost:3000`).
2. Log in.
3. Open the browser console (F12) and run:
   ```javascript
   await window.Clerk.session.getToken();
   ```
4. Copy the output string and use it in Postman or cURL as the `Authorization: Bearer <token>` header.

---

## 7. Development Bypass (Local Testing Without Clerk)

For quick backend testing without needing a real Clerk token, you can bypass authentication.

1. Set `AUTH_BYPASS=true` in your backend `.env.local` file.
2. Send requests with these headers instead of a Bearer token:
   ```http
   X-User-Id: dev-user-001
   X-User-Email: dev@oppskills.com
   ```
   _Note: This only works in development. It is fully disabled in production._

---

## 8. Infrastructure & Admin Auth

- **Clerk Webhooks (`POST /user-accounts/clerk-webhook`)**: The backend listens to Clerk webhooks to keep the local database in sync when a user signs up or updates their profile.
- **Admin Auth**: Platform administrators do not use Clerk. They use a separate internal JWT system (`POST /admin/login`). See `admin.md` for details.
