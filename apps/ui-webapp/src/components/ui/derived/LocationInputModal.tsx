"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { isValidUrl, cn } from "@/lib/utils";
import { MapPoint } from "@solar-icons/react";
import InputBlock from "@/components/ui/derived/InputBlock";

interface LocationInputModalProps {
  value: string;
  onChange: (value: string) => void;
  title?: string;
  label?: string;
  subLabel?: string;
  icon?: React.ReactNode;
  className?: string;
  triggerClassName?: string;
  /** Whether to show the InputBlock as a trigger. If false, you must provide your own trigger via children. */
  useDefaultTrigger?: boolean;
  children?: React.ReactNode;
}

/**
 * A reusable location input modal that allows toggling between
 * Physical (Offline) and Virtual (Online) locations.
 *
 * Supports "OFFLINE:" and "VIRTUAL:" prefixes for internal state management,
 * and automatically detects URLs as virtual.
 */
export default function LocationInputModal({
  value,
  onChange,
  title = "Update Location",
  label,
  subLabel = "Offline location or virtual link",
  icon = <MapPoint className="w-6 h-6" />,
  className,
  triggerClassName,
  useDefaultTrigger = true,
  children,
}: LocationInputModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempMode, setTempMode] = useState<"OFFLINE" | "VIRTUAL">("OFFLINE");
  const [tempValue, setTempValue] = useState("");

  // Sync internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      const loc = value || "";
      const isVirtual =
        loc.startsWith("VIRTUAL:") ||
        (!loc.startsWith("OFFLINE:") && isValidUrl(loc));
      setTempMode(isVirtual ? "VIRTUAL" : "OFFLINE");
      setTempValue(
        loc.startsWith("VIRTUAL:")
          ? loc.substring(8)
          : loc.startsWith("OFFLINE:")
            ? loc.substring(8)
            : loc,
      );
    }
  }, [isOpen, value]);

  const handleSave = () => {
    const trimmedVal = tempValue.trim();

    if (tempMode === "VIRTUAL") {
      if (trimmedVal.length === 0) {
        toast.error("Virtual link cannot be empty.");
        return;
      }
      if (!isValidUrl(trimmedVal)) {
        toast.error("Please enter a valid URL for the virtual link.");
        return;
      }
    } else if (trimmedVal.length === 0) {
      // We allow empty offline location if the user wants to clear it?
      // Actually, most forms require it. But let's stay consistent with current behavior.
    }

    const prefix = tempMode === "VIRTUAL" ? "VIRTUAL:" : "OFFLINE:";
    onChange(prefix + trimmedVal);
    setIsOpen(false);
    toast.success("Location updated successfully.");
  };

  const displayLabel = value
    ? value.startsWith("OFFLINE:")
      ? value.substring(8)
      : value.startsWith("VIRTUAL:")
        ? value.substring(8)
        : value
    : label || "Add Location";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {useDefaultTrigger ? (
          <div className={cn("h-full cursor-pointer", triggerClassName)}>
            <InputBlock
              icon={icon}
              label={displayLabel}
              subLabel={subLabel}
              className={className}
            />
          </div>
        ) : (
          children
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white border border-border rounded-xl p-6 shadow-lg animate-in fade-in zoom-in duration-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-2">
          {/* Toggle Switch */}
          <div className="flex bg-muted p-1 rounded-lg gap-1 border border-border/40">
            <button
              type="button"
              onClick={() => setTempMode("OFFLINE")}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
                tempMode === "OFFLINE"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/40",
              )}
            >
              Offline
            </button>
            <button
              type="button"
              onClick={() => setTempMode("VIRTUAL")}
              className={cn(
                "flex-1 py-2 text-sm font-semibold rounded-md transition-all",
                tempMode === "VIRTUAL"
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-white/40",
              )}
            >
              Virtual
            </button>
          </div>

          {/* Input Field */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-foreground">
              {tempMode === "VIRTUAL"
                ? "Virtual Meeting Link"
                : "Offline Venue Address"}
            </label>
            <input
              type="text"
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSave();
                }
              }}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={
                tempMode === "VIRTUAL"
                  ? "e.g. https://zoom.us/j/..."
                  : "e.g. Science City Auditorium, NY"
              }
              autoFocus
            />
          </div>

          <Button
            type="button"
            onClick={handleSave}
            className="w-full h-11 font-bold rounded-lg mt-2 transition-all bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
