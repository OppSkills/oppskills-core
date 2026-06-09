"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";

interface StickyDateBadgeProps {
  date: string;
  show: boolean;
}

const StickyDateBadge = React.memo(function StickyDateBadge({
  date,
  show,
}: StickyDateBadgeProps) {
  return (
    <AnimatePresence>
      {show && date && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 z-20"
        >
          <span className="bg-white border border-neutral-200 text-neutral-700 px-4 py-1.5 rounded-full shadow-md font-semibold text-xs whitespace-nowrap">
            {date}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default StickyDateBadge;
