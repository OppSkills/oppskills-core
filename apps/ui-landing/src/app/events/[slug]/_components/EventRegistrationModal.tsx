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

// Onboarding Types
export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
  PREFER_NOT_TO_SAY = "PREFER_NOT_TO_SAY",
}

export enum UserCategory {
  SCHOOL_STUDENT = "SCHOOL_STUDENT",
  COLLEGE_STUDENT = "COLLEGE_STUDENT",
  WORKING_PROFESSIONAL = "WORKING_PROFESSIONAL",
  FRESHER = "FRESHER",
  PROFESSIONAL_SCHOOL_STUDENT = "PROFESSIONAL_SCHOOL_STUDENT",
}

export enum ExperienceLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT",
}

export enum TeamPreference {
  LOOKING_FOR_TEAM = "LOOKING_FOR_TEAM",
  HAVE_TEAM = "HAVE_TEAM",
  OPEN_TO_EITHER = "OPEN_TO_EITHER",
  PREFER_SOLO = "PREFER_SOLO",
}

export interface OnboardingValues {
  // Step 1
  gender?: Gender;
  userCategory?: UserCategory;

  // Step 2
  schoolName?: string;
  schoolClass?: string;
  schoolAddress?: string;

  collegeName?: string; // Using name for simplicity in modal, ideally ID if autocomplete
  collegeCurrentYear?: string;
  collegePassoutYear?: number;

  companyName?: string;
  jobTitle?: string;

  // Step 3
  locationCity?: string;
  locationState?: string;
  locationCountry?: string;

  // Step 4
  interests?: string[];
  skills?: string[];

  // Step 5
  experienceLevel?: ExperienceLevel;

  // Step 6
  teamPreference?: TeamPreference;
}

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

  // Onboarding fields
  gender?: string;
  userCategory?: UserCategory;

  schoolName?: string;
  schoolClass?: string;
  schoolAddress?: string;

  collegeName?: string;
  collegeCurrentYear?: string;
  collegePassoutYear?: number;

  companyName?: string;
  jobTitle?: string;

  locationCity?: string;
  locationState?: string;
  locationCountry?: string;

  interests?: string[];
  skills?: string[];

  experienceLevel?: ExperienceLevel;
  teamPreference?: TeamPreference;
}

export interface EventRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
    onboardingData?: OnboardingValues
  ) => Promise<void>;
  fields: RegistrationField[];
  eventName: string;
  isSubmitting: boolean;
  userData?: UserDataForPrefill;
  showOnboarding?: boolean;
}

type FieldValue = string | number | string[];
type FieldErrors = Record<string, string>;

/**
 * Matches a field label to prefill data key based on common patterns.
 */
function getPrefilledValue(
  field: RegistrationField,
  userData: UserDataForPrefill | undefined
): string | undefined {
  if (!userData) return undefined;

  const label = field.label.toLowerCase();

  // Name matching (but not college/school/company name)
  if (
    label.includes("name") &&
    !label.includes("college") &&
    !label.includes("school") &&
    !label.includes("company")
  ) {
    return userData.name;
  }

  // Email matching
  if (label.includes("email") || field.type === "EMAIL") {
    return userData.email;
  }

  // Phone matching
  if (
    label.includes("phone") ||
    label.includes("mobile") ||
    field.type === "PHONE_NO"
  ) {
    return userData.phone;
  }

  // Gender matching
  if (label.includes("gender")) {
    return userData.gender;
  }

  // College matching
  if (
    label.includes("college") ||
    label.includes("university") ||
    label.includes("institution")
  ) {
    return userData.collegeName;
  }

  // Company matching
  if (
    label.includes("company") ||
    label.includes("organization") ||
    label.includes("employer")
  ) {
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
  showOnboarding = false,
}: EventRegistrationModalProps) {
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<FieldErrors>({});

  // Onboarding State
  // Keeping step state just in case, but we are single page now
  const [onboardingValues, setOnboardingValues] = useState<OnboardingValues>(
    {}
  );

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

      // Pre-fill onboarding fields if visible
      if (showOnboarding) {
        const startingOnboardingValues: OnboardingValues = {};

        // Map all available userData to OnboardingValues
        if (userData.gender)
          startingOnboardingValues.gender = userData.gender as Gender;
        if (userData.userCategory)
          startingOnboardingValues.userCategory = userData.userCategory;

        if (userData.schoolName)
          startingOnboardingValues.schoolName = userData.schoolName;
        if (userData.schoolClass)
          startingOnboardingValues.schoolClass = userData.schoolClass;
        if (userData.schoolAddress)
          startingOnboardingValues.schoolAddress = userData.schoolAddress;

        if (userData.collegeName)
          startingOnboardingValues.collegeName = userData.collegeName;
        if (userData.collegeCurrentYear)
          startingOnboardingValues.collegeCurrentYear =
            userData.collegeCurrentYear;
        if (userData.collegePassoutYear)
          startingOnboardingValues.collegePassoutYear =
            userData.collegePassoutYear;

        if (userData.companyName)
          startingOnboardingValues.companyName = userData.companyName;
        if (userData.jobTitle)
          startingOnboardingValues.jobTitle = userData.jobTitle;

        if (userData.locationCity)
          startingOnboardingValues.locationCity = userData.locationCity;
        if (userData.locationState)
          startingOnboardingValues.locationState = userData.locationState;
        if (userData.locationCountry)
          startingOnboardingValues.locationCountry = userData.locationCountry;

        if (userData.interests)
          startingOnboardingValues.interests = userData.interests;
        if (userData.skills) startingOnboardingValues.skills = userData.skills;

        if (userData.experienceLevel)
          startingOnboardingValues.experienceLevel = userData.experienceLevel;
        if (userData.teamPreference)
          startingOnboardingValues.teamPreference = userData.teamPreference;

        setOnboardingValues((prev) => ({
          ...prev,
          ...startingOnboardingValues,
        }));
      }
    } else if (!isOpen) {
      // Reset on close
      setValues({});
      setErrors({});
      setOnboardingValues({}); // Reset onboarding values too
    }
  }, [isOpen, userData, fields, showOnboarding]);

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

  const validateOnboarding = (): {
    isValid: boolean;
    newErrors: FieldErrors;
  } => {
    if (!showOnboarding) return { isValid: true, newErrors: {} };

    let isValid = true;
    const newErrors: FieldErrors = {};

    // Helper to check required fields
    const checkRequired = (
      key: keyof OnboardingValues,
      label: string,
      errorKey: string
    ) => {
      const value = onboardingValues[key];
      if (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      ) {
        newErrors[errorKey] = `Field "${label}" is required`;
        isValid = false;
      }
    };

    checkRequired("gender", "Gender", "gender");
    checkRequired("userCategory", "User Category", "userCategory");

    if (onboardingValues.userCategory === UserCategory.SCHOOL_STUDENT) {
      checkRequired("schoolName", "School Name", "schoolName");
      checkRequired("schoolClass", "Class", "schoolClass");
      checkRequired("schoolAddress", "School Address", "schoolAddress");
    }

    if (
      onboardingValues.userCategory === UserCategory.COLLEGE_STUDENT ||
      onboardingValues.userCategory === UserCategory.PROFESSIONAL_SCHOOL_STUDENT
    ) {
      checkRequired("collegeName", "College Name", "collegeName");
      checkRequired("collegeCurrentYear", "Current Year", "collegeCurrentYear");
    }

    if (onboardingValues.userCategory === UserCategory.WORKING_PROFESSIONAL) {
      checkRequired("companyName", "Company Name", "companyName");
      checkRequired("jobTitle", "Job Title", "jobTitle");
    }

    checkRequired("locationCity", "City", "locationCity");
    checkRequired("locationState", "State", "locationState");
    checkRequired("locationCountry", "Country", "locationCountry");

    return { isValid, newErrors };
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    // Validate Registration Fields
    for (const field of supportedFields) {
      const value = values[field.id];

      // Check required
      if (field.required) {
        if (
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
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
          const phoneRegex = /^[6-9][0-9]{9}$/;
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

    const isRegistrationValid = Object.keys(newErrors).length === 0;

    // Validate Onboarding
    const onboardingValidation = validateOnboarding();
    if (!onboardingValidation.isValid) {
      setErrors((prev) => ({ ...prev, ...onboardingValidation.newErrors }));
    }

    return isRegistrationValid && onboardingValidation.isValid;
  };

  // Helper to map category to default identity field ID
  const getIdentityFieldId = (category: UserCategory): string | null => {
    switch (category) {
      case UserCategory.SCHOOL_STUDENT:
        return "default-school-name";
      case UserCategory.COLLEGE_STUDENT:
      case UserCategory.PROFESSIONAL_SCHOOL_STUDENT:
      case UserCategory.FRESHER:
        return "default-college-name";
      case UserCategory.WORKING_PROFESSIONAL:
        return "default-company-name";
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      // Optional: Trigger a toast if validation fails silently for the user (especially for onboarding fields which might not show error text yet)
      return;
    }

    // Build answers array
    const answers: Array<{
      fieldId: string;
      value: string | number | string[];
    }> = [];

    // Capture standard fields
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

    // Determine current category to inject the correct default identity field
    const effectiveCategory = showOnboarding
      ? onboardingValues.userCategory
      : userData?.userCategory;

    // Determine values source
    const valuesSource = showOnboarding ? onboardingValues : userData;

    if (effectiveCategory && valuesSource) {
      const identityFieldId = getIdentityFieldId(
        effectiveCategory as UserCategory
      );
      let identityValue: string | undefined;

      if (effectiveCategory === UserCategory.SCHOOL_STUDENT) {
        identityValue = valuesSource.schoolName;
      } else if (
        effectiveCategory === UserCategory.COLLEGE_STUDENT ||
        effectiveCategory === UserCategory.PROFESSIONAL_SCHOOL_STUDENT
      ) {
        identityValue = valuesSource.collegeName;
      } else if (effectiveCategory === UserCategory.WORKING_PROFESSIONAL) {
        identityValue = valuesSource.companyName;
      }

      // Inject if we have both ID and Value, and it's not already in answers
      // (It might be in answers if the form happened to have that exact field ID, but usually dynamic fields have UUIDs)
      // We prioritize this injection to ensure the backend gets the specific default field it expects for the category.
      if (identityFieldId && identityValue) {
        // Check if already exists (unlikely but safe to check)
        const existingIndex = answers.findIndex(
          (a) => a.fieldId === identityFieldId
        );
        if (existingIndex > -1) {
          answers[existingIndex].value = identityValue;
        } else {
          answers.push({ fieldId: identityFieldId, value: identityValue });
        }
      }
    }

    if (showOnboarding) {
      // Filter onboarding data based on category to avoid sending irrelevant fields
      const filteredOnboardingData: OnboardingValues = {
        // Common fields
        gender: onboardingValues.gender,
        userCategory: onboardingValues.userCategory,
        locationCity: onboardingValues.locationCity,
        locationState: onboardingValues.locationState,
        locationCountry: onboardingValues.locationCountry,
        interests: onboardingValues.interests,
        skills: onboardingValues.skills,
        experienceLevel: onboardingValues.experienceLevel,
        teamPreference: onboardingValues.teamPreference,
      };

      if (onboardingValues.userCategory === UserCategory.SCHOOL_STUDENT) {
        filteredOnboardingData.schoolName = onboardingValues.schoolName;
        filteredOnboardingData.schoolClass = onboardingValues.schoolClass;
        filteredOnboardingData.schoolAddress = onboardingValues.schoolAddress;
      } else if (
        onboardingValues.userCategory === UserCategory.COLLEGE_STUDENT ||
        onboardingValues.userCategory ===
          UserCategory.PROFESSIONAL_SCHOOL_STUDENT
      ) {
        filteredOnboardingData.collegeName = onboardingValues.collegeName;
        filteredOnboardingData.collegeCurrentYear =
          onboardingValues.collegeCurrentYear;
        filteredOnboardingData.collegePassoutYear =
          onboardingValues.collegePassoutYear;
      } else if (
        onboardingValues.userCategory === UserCategory.WORKING_PROFESSIONAL
      ) {
        filteredOnboardingData.companyName = onboardingValues.companyName;
        filteredOnboardingData.jobTitle = onboardingValues.jobTitle;
      }

      await onSubmit(answers, filteredOnboardingData);
    } else {
      await onSubmit(answers);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // Update onboarding value helper
  const updateOnboardingValue = (key: keyof OnboardingValues, value: any) => {
    setOnboardingValues((prev) => ({ ...prev, [key]: value }));
  };

  // Check if any dynamic field is "Gender"
  const dynamicGenderField = supportedFields.find(
    (f) => f.label.toLowerCase() === "gender"
  );

  const renderOnboardingFields = () => {
    return (
      <div className="space-y-6 pt-4">
        {/* Step 1: Basic Info */}
        <div className="grid grid-cols-1">
          {!dynamicGenderField && (
            <div className="space-y-2">
              <Label>
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select
                value={onboardingValues.gender}
                onValueChange={(v) => updateOnboardingValue("gender", v)}
              >
                <SelectTrigger
                  className={cn(errors.gender && "border-red-500")}
                >
                  <SelectValue placeholder="Select Gender" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Gender).map((g) => (
                    <SelectItem key={g} value={g}>
                      {g.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.gender && (
                <p className="text-xs text-red-500">{errors.gender}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label>
              User Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={onboardingValues.userCategory}
              onValueChange={(v) => updateOnboardingValue("userCategory", v)}
            >
              <SelectTrigger
                className={cn(errors.userCategory && "border-red-500")}
              >
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UserCategory).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userCategory && (
              <p className="text-xs text-red-500">{errors.userCategory}</p>
            )}
          </div>
        </div>

        {/* Step 2: Education/Work */}
        {onboardingValues.userCategory === UserCategory.SCHOOL_STUDENT && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                School Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter School Name"
                value={onboardingValues.schoolName || ""}
                onChange={(e) =>
                  updateOnboardingValue("schoolName", e.target.value)
                }
                className={cn(errors.schoolName && "border-red-500")}
              />
              {errors.schoolName && (
                <p className="text-xs text-red-500">{errors.schoolName}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Class <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="e.g. 10th, 12th"
                  value={onboardingValues.schoolClass || ""}
                  onChange={(e) =>
                    updateOnboardingValue("schoolClass", e.target.value)
                  }
                  className={cn(errors.schoolClass && "border-red-500")}
                />
                {errors.schoolClass && (
                  <p className="text-xs text-red-500">{errors.schoolClass}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>
                  School Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="City, Area"
                  value={onboardingValues.schoolAddress || ""}
                  onChange={(e) =>
                    updateOnboardingValue("schoolAddress", e.target.value)
                  }
                  className={cn(errors.schoolAddress && "border-red-500")}
                />
                {errors.schoolAddress && (
                  <p className="text-xs text-red-500">{errors.schoolAddress}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {(onboardingValues.userCategory === UserCategory.COLLEGE_STUDENT ||
          onboardingValues.userCategory ===
            UserCategory.PROFESSIONAL_SCHOOL_STUDENT) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                College Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter College Name"
                value={onboardingValues.collegeName || ""}
                onChange={(e) =>
                  updateOnboardingValue("collegeName", e.target.value)
                }
                className={cn(errors.collegeName && "border-red-500")}
              />
              {errors.collegeName && (
                <p className="text-xs text-red-500">{errors.collegeName}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Current Year <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={onboardingValues.collegeCurrentYear}
                  onValueChange={(v) =>
                    updateOnboardingValue("collegeCurrentYear", v)
                  }
                >
                  <SelectTrigger
                    className={cn(
                      errors.collegeCurrentYear && "border-red-500"
                    )}
                  >
                    <SelectValue placeholder="Select Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "1st Year",
                      "2nd Year",
                      "3rd Year",
                      "4th Year",
                      "5th Year",
                      "Graduated",
                    ].map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.collegeCurrentYear && (
                  <p className="text-xs text-red-500">
                    {errors.collegeCurrentYear}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Passout Year</Label>
                <Input
                  type="number"
                  placeholder="e.g. 2026"
                  value={onboardingValues.collegePassoutYear || ""}
                  onChange={(e) =>
                    updateOnboardingValue(
                      "collegePassoutYear",
                      parseInt(e.target.value) || undefined
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}

        {onboardingValues.userCategory ===
          UserCategory.WORKING_PROFESSIONAL && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter Company Name"
                value={onboardingValues.companyName || ""}
                onChange={(e) =>
                  updateOnboardingValue("companyName", e.target.value)
                }
                className={cn(errors.companyName && "border-red-500")}
              />
              {errors.companyName && (
                <p className="text-xs text-red-500">{errors.companyName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="e.g. Software Engineer"
                value={onboardingValues.jobTitle || ""}
                onChange={(e) =>
                  updateOnboardingValue("jobTitle", e.target.value)
                }
                className={cn(errors.jobTitle && "border-red-500")}
              />
              {errors.jobTitle && (
                <p className="text-xs text-red-500">{errors.jobTitle}</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>
              City <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter City"
              value={onboardingValues.locationCity || ""}
              onChange={(e) =>
                updateOnboardingValue("locationCity", e.target.value)
              }
              className={cn(errors.locationCity && "border-red-500")}
            />
            {errors.locationCity && (
              <p className="text-xs text-red-500">{errors.locationCity}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              State <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter State"
              value={onboardingValues.locationState || ""}
              onChange={(e) =>
                updateOnboardingValue("locationState", e.target.value)
              }
              className={cn(errors.locationState && "border-red-500")}
            />
            {errors.locationState && (
              <p className="text-xs text-red-500">{errors.locationState}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              Country <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="Enter Country"
              value={onboardingValues.locationCountry || ""}
              onChange={(e) =>
                updateOnboardingValue("locationCountry", e.target.value)
              }
              className={cn(errors.locationCountry && "border-red-500")}
            />
            {errors.locationCountry && (
              <p className="text-xs text-red-500">{errors.locationCountry}</p>
            )}
          </div>
        </div>
      </div>
    );
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
              onValueChange={(v) => {
                setValue(field.id, v);
                if (isGenderField) {
                  updateOnboardingValue("gender", v);
                }
              }}
            >
              <SelectTrigger
                id={field.id}
                className={cn(error && "border-red-500")}
              >
                <SelectValue
                  placeholder={field.placeholder || `Select ${field.label}`}
                />
              </SelectTrigger>
              <SelectContent>
                {effectiveOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {isGenderField
                      ? GENDER_OPTION_LABELS[option] || option
                      : option}
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
              value={
                typeof value === "string" || typeof value === "number"
                  ? value
                  : ""
              }
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

  const renderContent = () => {
    // Consolidated Registration Form
    return (
      <form
        onSubmit={handleSubmit}
        className="space-y-4 mt-4 animate-in fade-in slide-in-from-right-4 duration-300"
      >
        {/* Unsupported fields warning */}
        {unsupportedFields.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              File upload fields are not supported yet:{" "}
              {unsupportedFields.map((f) => f.label).join(", ")}
            </p>
          </div>
        )}

        {/* No fields message */}
        {supportedFields.length === 0 &&
          unsupportedFields.length === 0 &&
          !showOnboarding && (
            <p className="text-muted-foreground text-center py-4">
              Click submit to register.
            </p>
          )}

        {/* Render supported fields */}
        {supportedFields.map((field) => renderField(field))}

        {/* Onboarding Fields */}
        {showOnboarding && renderOnboardingFields()}

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
            ) : showOnboarding ? (
              "Register & Join"
            ) : (
              "Register"
            )}
          </Button>
        </div>
      </form>
    );
  };

  const currentTitle = showOnboarding
    ? "Complete Registration"
    : "Register for Event";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {currentTitle}
          </DialogTitle>
          <DialogDescription>
            {showOnboarding ? (
              "Please provide the required details to register."
            ) : (
              <>
                Complete your registration for{" "}
                <span className="font-semibold">{eventName}</span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
