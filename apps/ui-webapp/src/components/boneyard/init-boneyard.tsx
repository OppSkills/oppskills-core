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
      color: "#ece8f0",
      darkColor: "#342636",
      animate: "shimmer",
      shimmerColor: "#f5f2f8",
      darkShimmerColor: "#3d3544",
      speed: "2s",
      shimmerAngle: 110,
      transition: true,
    });
  }, []);
  return null;
}
