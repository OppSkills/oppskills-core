"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

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

    /**
     * Session replay (rrweb) snapshots the DOM on mutations. The dashboard has a
     * very large tree (sidebars, tables, nested Radix). Opening a Dialog adds a
     * portal + overlay + scroll-lock — replay can spend multiple seconds on the
     * main thread (seen as ~9s scripting in Performance). Disable replay on
     * dashboard routes; events/analytics still work via capture + identify.
     */
    const disableSessionRecordingOnDashboard = window.location.pathname.startsWith(
      "/dashboard",
    );

    posthog.init(posthogKey, {
      api_host: posthogHost || "https://us.i.posthog.com",
      // Uses recommended 2025 defaults which automatically handles pageview and pageleave events
      defaults: "2025-11-30",
      capture_pageleave: true,
      disable_session_recording: disableSessionRecordingOnDashboard,
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") {
          console.log("PostHog initialized successfully");
        }
        // Remote config can re-enable replay; enforce off on dashboard after init.
        if (window.location.pathname.startsWith("/dashboard") && ph.sessionRecordingStarted()) {
          ph.stopSessionRecording();
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
      <PostHogStopSessionRecordingOnDashboard />
      {children}
    </PHProvider>
  );
}

/**
 * If the user lands on a non-dashboard route first (session replay may start),
 * stop recording when they client-navigate into `/dashboard/*`.
 */
function PostHogStopSessionRecordingOnDashboard() {
  const pathname = usePathname();
  const client = usePostHog();

  useEffect(() => {
    if (!client || !pathname.startsWith("/dashboard")) return;
    try {
      if (client.sessionRecordingStarted()) {
        client.stopSessionRecording();
      }
    } catch {
      // ignore
    }
  }, [pathname, client]);

  return null;
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
