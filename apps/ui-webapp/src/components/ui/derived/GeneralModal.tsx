"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GeneralModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  footerActions?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
}

export default function GeneralModal({
  isOpen,
  onClose,
  title,
  footerActions,
  children,
  maxWidth = "max-w-[95%]",
}: GeneralModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`relative w-full ${maxWidth} max-h-[90vh] md:max-h-[85vh] flex flex-col bg-background rounded-2xl shadow-2xl overflow-hidden border border-border`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 bg-neutral-300 border-b border-border select-none">
              <p className="text-neutral-900 text-2xl font-bold leading-[120%] tracking-tight capitalize">
                {title}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-400/40 active:bg-neutral-400/60 transition-colors focus:outline-none"
              >
                <X className="w-5 h-5 text-neutral-700 font-bold" />
              </button>
            </div>

            {/* Content (Scrollable Body) */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
              {children}
            </div>

            {/* Footer */}
            {footerActions && (
              <div className="flex items-center justify-end px-6 py-5 bg-neutral-300 border-t border-border select-none">
                {footerActions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
