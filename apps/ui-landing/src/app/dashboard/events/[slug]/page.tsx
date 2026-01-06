"use client";

import { ChartNoAxesCombined } from "lucide-react";
import { motion } from "framer-motion";

export default function Page() {
  return (
    <div className="flex flex-1 min-h-0 items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col items-center gap-4 text-center"
      >
        {/* Icon */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <ChartNoAxesCombined className="h-20 w-20 text-muted-foreground" />
        </motion.div>

        {/* Text */}
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Coming Soon</h1>
          <p className="text-sm text-muted-foreground max-w-xs">
            This dashboard section is under active development.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
