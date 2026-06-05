"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { sendUserLocation } from "@/lib/api/recommendationApi";

export default function LocationTracker() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  // Keep refs of values so we don't have to keep re-running the effect
  const authRef = useRef({ isLoaded, isSignedIn, getToken });
  authRef.current = { isLoaded, isSignedIn, getToken };

  useEffect(() => {
    const track = async () => {
      try {
        console.log("[LocationTracker] Mounting and requesting geolocation...");

        // 1. Check if geolocation is supported
        if (!("geolocation" in navigator)) {
          console.warn(
            "[LocationTracker] Geolocation is not supported by this browser.",
          );
          return;
        }

        // 2. Request current position
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const coords = { latitude, longitude, timestamp: Date.now() };

            console.log("[LocationTracker] Geolocation success:", coords);

            // Save in localStorage
            localStorage.setItem("user_coords", JSON.stringify(coords));

            // Define a helper to wait for Clerk to load
            const waitForClerkAndSend = async () => {
              // Wait up to 10 seconds for Clerk to load
              for (let i = 0; i < 100; i++) {
                if (authRef.current.isLoaded) {
                  break;
                }
                await new Promise((resolve) => setTimeout(resolve, 100));
              }

              const {
                isLoaded: clerkLoaded,
                isSignedIn: loggedIn,
                getToken: fetchToken,
              } = authRef.current;

              console.log(
                "[LocationTracker] Clerk status on sending location - isLoaded:",
                clerkLoaded,
                "isSignedIn:",
                loggedIn,
              );

              try {
                const token =
                  clerkLoaded && loggedIn ? await fetchToken() : null;
                console.log(
                  "[LocationTracker] Sending coordinates to backend. Authenticated:",
                  !!token,
                );
                await sendUserLocation(token, { latitude, longitude });
                console.log(
                  "[LocationTracker] Successfully sent coordinates to backend.",
                );
              } catch (apiError) {
                console.error(
                  "[LocationTracker] Failed to send location to backend:",
                  apiError,
                );
              }
            };

            // Run in background
            waitForClerkAndSend();
          },
          (geoError) => {
            console.warn(
              "[LocationTracker] Geolocation permission denied or failed:",
              geoError.message,
            );
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          },
        );
      } catch (err) {
        console.error("[LocationTracker] Error in tracking logic:", err);
      }
    };

    track();
  }, []); // Run exactly once on mount (per refresh)!

  return null;
}
