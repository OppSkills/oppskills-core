"use client";

import { useLayoutEffect } from "react";
import { configureBoneyard } from "boneyard-js/react";

let configured = false;

/**
 * One-time runtime defaults aligned with boneyard.config.json and app theme.
 */
export function InitBoneyard() {
  useLayoutEffect(() => {
    if (configured) return;
    configured = true;
    configureBoneyard({
      color: "#e5e5e5",
      darkColor: "#3f3f46",
      animate: "shimmer",
      shimmerColor: "#f0f0f0",
      darkShimmerColor: "#52525b",
      speed: "2s",
      shimmerAngle: 110,
      transition: true,
    });
  }, []);
  return null;
}
