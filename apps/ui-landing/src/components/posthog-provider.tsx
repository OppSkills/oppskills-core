"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") {
      return;
    }

    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    // Only initialize PostHog if the key is provided
    if (!posthogKey) {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "PostHog: NEXT_PUBLIC_POSTHOG_KEY is not set. PostHog analytics will be disabled."
        );
      }
      return;
    }

    // Prevent double initialization
    if (posthog.__loaded) {
      return;
    }

    posthog.init(posthogKey, {
      api_host: posthogHost || "https://us.i.posthog.com",
      // Uses recommended 2025 defaults which automatically handles pageview and pageleave events
      defaults: "2025-11-30",
      capture_pageleave: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") {
          console.log("PostHog initialized successfully");
        }
      },
    });
  }, []);

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  // If PostHog is not configured, render children without provider
  if (!posthogKey) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PostHogIdentify />
      {children}
    </PHProvider>
  );
}

// Identify logged-in users with PostHog
function PostHogIdentify() {
  const posthog = usePostHog();
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    if (isSignedIn && userId && posthog) {
      posthog.identify(userId, {
        email: user?.emailAddresses?.[0]?.emailAddress,
        name: user?.fullName,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
      });
    } else if (!isSignedIn && posthog) {
      posthog.reset();
    }
  }, [isSignedIn, userId, user, posthog]);

  return null;
}
