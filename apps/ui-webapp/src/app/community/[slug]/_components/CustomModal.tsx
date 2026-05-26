"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function CustomModal({
  isOpen,
  onClose,
  title,
  footer,
  children,
  className,
}: CustomModalProps) {
  // Disable scrolling on background body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      {/* Backdrop Close Click area */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Main Modal Shell exactly matching the soft rounded corner specs */}
      <div
        className={cn(
          "w-full max-w-2xl bg-white shadow-2xl rounded-[32px] overflow-hidden flex flex-col relative z-10 animate-in zoom-in-95 fade-in duration-300 transform",
          className,
        )}
      >
        {/* Soft Grey Header Block (#EDEDED) */}
        <div className="bg-[#EDEDED] px-8 py-5 flex items-center justify-between border-b border-neutral-200/50">
          <h3 className="font-aeonicPro text-2xl font-semibold tracking-tight text-[#0C0114]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-300/60 text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
            title="Close Dialog"
          >
            <X className="w-5 h-5 stroke-2" />
          </button>
        </div>

        {/* White Modal Content Body */}
        <div className="bg-white px-8 py-6 flex-1 overflow-y-auto max-h-[65vh]">
          {children}
        </div>

        {/* Optional Soft Grey Footer Block (#EDEDED) */}
        {footer && (
          <div className="bg-[#EDEDED] px-8 py-4.5 flex items-center justify-end border-t border-neutral-200/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
