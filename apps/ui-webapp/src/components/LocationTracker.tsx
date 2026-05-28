"use client";

import { useEffect } from "react";

export default function LocationTracker() {
  useEffect(() => {
    const track = async () => {
      try {
        console.log("[LocationTracker] Mounting and requesting geolocation...");

        // 1. Check if geolocation is supported
        if (!("geolocation" in navigator)) {
          console.warn("[LocationTracker] Geolocation is not supported by this browser.");
          return;
        }

        // 2. Request current position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const coords = { latitude, longitude, timestamp: Date.now() };

            console.log("[LocationTracker] Geolocation success:", coords);

            // Save in localStorage
            localStorage.setItem("user_coords", JSON.stringify(coords));
          },
          (geoError) => {
            console.warn("[LocationTracker] Geolocation permission denied or failed:", geoError.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      } catch (err) {
        console.error("[LocationTracker] Error in tracking logic:", err);
      }
    };

    track();
  }, []); // Run exactly once on mount (per refresh)!

  return null;
}
