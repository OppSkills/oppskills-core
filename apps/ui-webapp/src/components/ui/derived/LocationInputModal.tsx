"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useAuth } from "@clerk/nextjs";
import { useDebounce } from "@/hooks/use-debounce";
import { autocompleteLocation } from "@/lib/api/recommendationApi";
import type { LocationSuggestionDto } from "@oppskills/types";

interface LocationInputModalProps {
  value: string;
  onChange: (value: string, placeId?: string) => void;
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
 *
 * Integrates location auto-suggestion for physical addresses.
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

  // Location suggestions state
  const { getToken } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSelectingRef = useRef(false);
  const [suggestions, setSuggestions] = useState<LocationSuggestionDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const ignoreQueryRef = useRef("");
  // Track the placeId of the currently selected suggestion
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | undefined>(
    undefined,
  );

  const debouncedQuery = useDebounce(tempValue, 400);

  // Sync internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      const loc = value || "";
      const isVirtual =
        loc.startsWith("VIRTUAL:") ||
        (!loc.startsWith("OFFLINE:") && isValidUrl(loc));
      setTempMode(isVirtual ? "VIRTUAL" : "OFFLINE");
      const val = loc.startsWith("VIRTUAL:")
        ? loc.substring(8)
        : loc.startsWith("OFFLINE:")
          ? loc.substring(8)
          : loc;
      setTempValue(val);
      ignoreQueryRef.current = val;
      setSuggestions([]);
      setShowDropdown(false);
      setFocusedIndex(-1);
      // Reset selected place id when modal re-opens
      setSelectedPlaceId(undefined);
    }
  }, [isOpen, value]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions based on debounced query
  useEffect(() => {
    if (tempMode !== "OFFLINE") {
      setSuggestions([]);
      return;
    }

    const trimmed = debouncedQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    if (trimmed === ignoreQueryRef.current) {
      return;
    }

    let active = true;

    async function fetchSuggestions() {
      setIsLoading(true);
      try {
        const token = await getToken();
        if (!token) return;
        const res = await autocompleteLocation(token, trimmed);
        if (active) {
          setSuggestions(res);
          setFocusedIndex(-1);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error("Failed to load suggestions:", err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    fetchSuggestions();

    return () => {
      active = false;
    };
  }, [debouncedQuery, tempMode, getToken]);

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
    }

    const prefix = tempMode === "VIRTUAL" ? "VIRTUAL:" : "OFFLINE:";
    // For OFFLINE locations, pass along the placeId if a suggestion was selected
    onChange(
      prefix + trimmedVal,
      tempMode === "OFFLINE" ? selectedPlaceId : undefined,
    );
    setIsOpen(false);
    toast.success("Location updated successfully.");
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestionDto) => {
    isSelectingRef.current = true;
    setTempValue(suggestion.description);
    ignoreQueryRef.current = suggestion.description;
    // Store the placeId of the selected suggestion
    setSelectedPlaceId(suggestion.placeId);
    setSuggestions([]);
    setShowDropdown(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
    setTimeout(() => {
      isSelectingRef.current = false;
    }, 100);
  };

  const handleFocus = async () => {
    if (!isSelectingRef.current) {
      setShowDropdown(true);
      const trimmed = tempValue.trim();
      if (trimmed.length >= 2 && suggestions.length === 0) {
        setIsLoading(true);
        try {
          const token = await getToken();
          if (token) {
            const res = await autocompleteLocation(token, trimmed);
            setSuggestions(res);
            setFocusedIndex(-1);
          }
        } catch (err) {
          console.error("Failed to load suggestions on focus:", err);
        } finally {
          setIsLoading(false);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      tempMode === "OFFLINE" &&
      showDropdown &&
      (suggestions.length > 0 || isLoading)
    ) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % (suggestions.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex(
          (prev) =>
            (prev - 1 + (suggestions.length || 1)) % (suggestions.length || 1),
        );
      } else if (e.key === "Enter") {
        if (focusedIndex >= 0 && focusedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[focusedIndex]);
        } else if (!isLoading) {
          e.preventDefault();
          handleSave();
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    }
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
          <div className="flex flex-col gap-2 relative" ref={dropdownRef}>
            <label className="text-sm font-semibold text-foreground">
              {tempMode === "VIRTUAL"
                ? "Virtual Meeting Link"
                : "Offline Venue Address"}
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={tempValue}
                onChange={(e) => {
                  setTempValue(e.target.value);
                  setShowDropdown(true);
                  ignoreQueryRef.current = "";
                  // User typed manually — clear the selected placeId
                  setSelectedPlaceId(undefined);
                }}
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder={
                  tempMode === "VIRTUAL"
                    ? "e.g. https://zoom.us/j/..."
                    : "e.g. Science City Auditorium, NY"
                }
                autoFocus
              />

              {tempMode === "OFFLINE" &&
                showDropdown &&
                (suggestions.length > 0 || isLoading) && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto divide-y divide-border/50 animate-in fade-in slide-in-from-top-1 duration-150">
                    {isLoading ? (
                      <div className="p-3 text-xs text-muted-foreground text-center">
                        Searching locations...
                      </div>
                    ) : (
                      suggestions.map((suggestion, index) => (
                        <button
                          type="button"
                          key={suggestion.placeId}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSelectSuggestion(suggestion)}
                          onMouseEnter={() => setFocusedIndex(index)}
                          className={cn(
                            "w-full text-left px-4 py-2.5 text-sm transition-colors flex flex-col gap-0.5",
                            focusedIndex === index
                              ? "bg-muted/80 text-foreground"
                              : "text-foreground/90 hover:bg-muted/45",
                          )}
                        >
                          <span className="font-medium text-foreground">
                            {suggestion.mainText}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {suggestion.secondaryText}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
            </div>
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
