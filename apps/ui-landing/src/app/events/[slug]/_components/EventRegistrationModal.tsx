"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Default gender options matching Prisma Gender enum
const DEFAULT_GENDER_OPTIONS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];

// Labels for display (more user-friendly)
const GENDER_OPTION_LABELS: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
  PREFER_NOT_TO_SAY: "Prefer not to say",
};

export interface RegistrationField {
  id: string;
  label: string;
  type: string; // TEXT, EMAIL, PHONE_NO, NUMBER, OPTIONS, ATTACHMENTS
  required: boolean;
  order: number;
  options: string[];
  placeholder: string | null;
}

export interface UserDataForPrefill {
  name?: string;
  email?: string;
  phone?: string;
  gender?: string;
  collegeName?: string;
  companyName?: string;
  schoolName?: string;
}

export interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answers: Array<{ fieldId: string; value: string | number | string[] }>) => Promise<void>;
  fields: RegistrationField[];
  eventName: string;
  isSubmitting: boolean;
  userData?: UserDataForPrefill;
}

type FieldValue = string | number | string[];
type FieldErrors = Record<string, string>;

/**
 * Matches a field label to prefill data key based on common patterns.
 */
function getPrefilledValue(field: RegistrationField, userData: UserDataForPrefill | undefined): string | undefined {
  if (!userData) return undefined;
  
  const label = field.label.toLowerCase();
  
  // Name matching (but not college/school/company name)
  if (label.includes("name") && !label.includes("college") && !label.includes("school") && !label.includes("company")) {
    return userData.name;
  }
  
  // Email matching
  if (label.includes("email") || field.type === "EMAIL") {
    return userData.email;
  }
  
  // Phone matching
  if (label.includes("phone") || label.includes("mobile") || field.type === "PHONE_NO") {
    return userData.phone;
  }
  
  // Gender matching
  if (label.includes("gender")) {
    return userData.gender;
  }
  
  // College matching
  if (label.includes("college") || label.includes("university") || label.includes("institution")) {
    return userData.collegeName;
  }
  
  // Company matching
  if (label.includes("company") || label.includes("organization") || label.includes("employer")) {
    return userData.companyName;
  }
  
  // School matching
  if (label.includes("school")) {
    return userData.schoolName;
  }
  
  return undefined;
}

export function EventRegistrationModal({
  isOpen,
  onClose,
  onSubmit,
  fields,
  eventName,
  isSubmitting,
  userData,
}: EventRegistrationModalProps) {
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<FieldErrors>({});

  // Filter out unsupported field types (ATTACHMENTS)
  const supportedFields = fields.filter((f) => f.type !== "ATTACHMENTS");
  const unsupportedFields = fields.filter((f) => f.type === "ATTACHMENTS");

  // Pre-fill values when modal opens
  useEffect(() => {
    if (isOpen && userData) {
      const prefilled: Record<string, FieldValue> = {};
      for (const field of supportedFields) {
        const prefilledValue = getPrefilledValue(field, userData);
        if (prefilledValue) {
          prefilled[field.id] = prefilledValue;
        }
      }
      setValues(prefilled);
      setErrors({});
    } else if (!isOpen) {
      // Reset on close
      setValues({});
      setErrors({});
    }
  }, [isOpen, userData, fields]);

  const setValue = (fieldId: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error on change
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    for (const field of supportedFields) {
      const value = values[field.id];

      // Check required
      if (field.required) {
        if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = `${field.label} is required`;
          continue;
        }
      }

      // Skip validation if empty and not required
      if (value === undefined || value === "") continue;

      // Type-specific validation
      switch (field.type) {
        case "EMAIL": {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (typeof value === "string" && !emailRegex.test(value)) {
            newErrors[field.id] = "Please enter a valid email address";
          }
          break;
        }
        case "PHONE_NO": {
          const phoneRegex = /^[+]?[\d\s\-()]{7,20}$/;
          if (typeof value === "string" && !phoneRegex.test(value)) {
            newErrors[field.id] = "Please enter a valid phone number";
          }
          break;
        }
        case "NUMBER": {
          if (typeof value === "string" && isNaN(Number(value))) {
            newErrors[field.id] = "Please enter a valid number";
          }
          break;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    // Build answers array
    const answers: Array<{ fieldId: string; value: string | number | string[] }> = [];
    
    for (const field of supportedFields) {
      const value = values[field.id];
      if (value !== undefined && value !== "") {
        // Convert NUMBER type to number
        if (field.type === "NUMBER" && typeof value === "string") {
          answers.push({ fieldId: field.id, value: Number(value) });
        } else {
          answers.push({ fieldId: field.id, value });
        }
      }
    }

    await onSubmit(answers);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const renderField = (field: RegistrationField) => {
    const error = errors[field.id];
    const value = values[field.id] ?? "";

    switch (field.type) {
      case "OPTIONS": {
        // For Gender field with empty options, inject default gender options
        const isGenderField = field.label.toLowerCase() === "gender";
        const effectiveOptions = 
          isGenderField && (!field.options || field.options.length === 0)
            ? DEFAULT_GENDER_OPTIONS
            : field.options;
        
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Select
              value={typeof value === "string" ? value : ""}
              onValueChange={(v) => setValue(field.id, v)}
            >
              <SelectTrigger
                id={field.id}
                className={cn(error && "border-red-500")}
              >
                <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
              </SelectTrigger>
              <SelectContent>
                {effectiveOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {isGenderField ? (GENDER_OPTION_LABELS[option] || option) : option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      }

      case "NUMBER":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder || ""}
              value={typeof value === "string" || typeof value === "number" ? value : ""}
              onChange={(e) => setValue(field.id, e.target.value)}
              className={cn(error && "border-red-500")}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "EMAIL":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="email"
              placeholder={field.placeholder || "email@example.com"}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => setValue(field.id, e.target.value)}
              className={cn(error && "border-red-500")}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "PHONE_NO":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="tel"
              placeholder={field.placeholder || "+91 XXXXX XXXXX"}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => setValue(field.id, e.target.value)}
              className={cn(error && "border-red-500")}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );

      case "TEXT":
      default:
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              id={field.id}
              type="text"
              placeholder={field.placeholder || ""}
              value={typeof value === "string" ? value : ""}
              onChange={(e) => setValue(field.id, e.target.value)}
              className={cn(error && "border-red-500")}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Register for Event</DialogTitle>
          <DialogDescription>
            Complete your registration for <span className="font-semibold">{eventName}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Unsupported fields warning */}
          {unsupportedFields.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                File upload fields are not supported yet:{" "}
                {unsupportedFields.map((f) => f.label).join(", ")}
              </p>
            </div>
          )}

          {/* No fields message */}
          {supportedFields.length === 0 && unsupportedFields.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              No additional information required. Click submit to register.
            </p>
          )}

          {/* Render supported fields */}
          {supportedFields.map((field) => renderField(field))}

          {/* Submit button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
