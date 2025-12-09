"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

/**
 * SSO Callback page for handling OAuth redirects from Clerk
 * This component automatically handles the OAuth callback, completing the authentication
 * process and managing the user's session. It uses the redirectUrlComplete from the
 * authenticateWithRedirect call to determine where to redirect after successful authentication.
 */
export default function SSOCallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Clerk CAPTCHA widget container for bot protection during OAuth flow */}
      <div id="clerk-captcha"></div>
      <AuthenticateWithRedirectCallback
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}
