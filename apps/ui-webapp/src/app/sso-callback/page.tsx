"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

/**
 * Inner component that handles the SSO callback with search params
 */
function SSOCallbackContent() {
  const searchParams = useSearchParams();

  // Get the redirect URL from search params, or fallback to "/"
  return (
    <AuthenticateWithRedirectCallback
      {...(searchParams.get("redirect_url")
        ? {
            afterSignInUrl: searchParams.get("redirect_url") as string,
            afterSignUpUrl: searchParams.get("redirect_url") as string,
          }
        : {})}
      /**
       * When Clerk sign-up requires additional info (e.g. username is required),
       * route the user back into our app instead of Clerk-hosted completion UI.
       */
      continueSignUpUrl="/complete-profile"
    />
  );
}

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
      <Suspense fallback={<div>Loading...</div>}>
        <SSOCallbackContent />
      </Suspense>
    </div>
  );
}
