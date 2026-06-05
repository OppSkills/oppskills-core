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
import { Loader2, AlertCircle, X, FileText } from "lucide-react";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { toast } from "sonner";
import { presignDocumentUpload } from "@/lib/api/mediaApi";
import { uploadDocumentToS3PresignedPost } from "@/lib/uploads/uploadDocumentToS3";
import { useAuth } from "@clerk/nextjs";
import { getMe, submitOnboarding, updateProfile } from "@/lib/api/usersApi";
import { RegistrationOnboardingFields } from "@/components/registration/RegistrationOnboardingFields";
import {
  EMPTY_REGISTRATION_ONBOARDING,
  type RegistrationOnboardingValues,
} from "@/lib/registration/registrationOnboardingTypes";
import {
  buildCreateOnboardingDtoFromRegistration,
  buildProfileNameUpdate,
  buildRegistrationSubmissionAnswers,
  clearRegistrationOnboardingForCategory,
  injectOnboardingIntoRegistrationAnswers,
  prefillRegistrationOnboarding,
  validateRegistrationOnboarding,
} from "@/lib/registration/registrationOnboardingSync";
import { UserCategoryValue } from "@oppskills/types/enums";
import type { RegistrationField } from "@/lib/registration/mergeRegistrationFields";

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

  collegeId?: string;
  collegeName?: string;
  collegeSkipped?: boolean;

  companyName?: string;
  jobTitle?: string;

  // Step 3
  interests?: string[];
  skills?: string[];

  // Step 5
  experienceLevel?: ExperienceLevel;

  // Step 6
  teamPreference?: TeamPreference;
}

export type { RegistrationField };

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

  collegeId?: string;
  collegeName?: string;
  collegeSkipped?: boolean;
  /** Profile data only — not shown in onboarding; can prefill registration custom fields */
  collegeCurrentYear?: string;
  collegePassoutYear?: number;

  companyName?: string;
  jobTitle?: string;

  locationCoords?: string;
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
    onboardingData?: OnboardingValues,
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
  userData: UserDataForPrefill | undefined,
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

  // Location / year — for custom registration fields only (not onboarding block)
  if (label.includes("city") && !label.includes("university")) {
    return userData.locationCoords;
  }
  if (label.includes("state") || label.includes("province")) {
    return userData.locationState;
  }
  if (label.includes("country")) {
    return userData.locationCountry;
  }
  if (
    label.includes("passout") ||
    (label.includes("year") && label.includes("graduation"))
  ) {
    return userData.collegePassoutYear !== undefined
      ? String(userData.collegePassoutYear)
      : undefined;
  }
  if (
    label.includes("current year") ||
    (label.includes("year") &&
      (label.includes("college") || label.includes("studying")))
  ) {
    return userData.collegeCurrentYear;
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
  showOnboarding = true,
}: EventRegistrationModalProps) {
  const { getToken } = useAuth();
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [errors, setErrors] = useState<FieldErrors>({});

  const [onboardingValues, setOnboardingValues] =
    useState<RegistrationOnboardingValues>(EMPTY_REGISTRATION_ONBOARDING);
  const [onboardingErrors, setOnboardingErrors] = useState<
    Record<string, string>
  >({});

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    Record<string, { name: string; url: string }>
  >({});

  // Support all fields now that attachments are supported
  const supportedFields = fields;
  const unsupportedFields: RegistrationField[] = [];

  // Pre-fill values when modal opens
  useEffect(() => {
    if (!isOpen) {
      setValues({});
      setErrors({});
      setOnboardingValues(EMPTY_REGISTRATION_ONBOARDING);
      setOnboardingErrors({});
      setUploadedFiles({});
      return;
    }

    const load = async () => {
      const prefilled: Record<string, FieldValue> = {};
      for (const field of supportedFields) {
        const prefilledValue = getPrefilledValue(field, userData);
        if (prefilledValue) prefilled[field.id] = prefilledValue;
      }
      setValues(prefilled);
      setErrors({});

      if (!showOnboarding) return;

      try {
        const token = await getToken();
        if (!token) return;
        const me = await getMe(token);
        setOnboardingValues(
          prefillRegistrationOnboarding({
            me,
            phone: userData?.phone,
          }),
        );
      } catch {
        if (userData) {
          setOnboardingValues({
            ...EMPTY_REGISTRATION_ONBOARDING,
            gender:
              (userData.gender as unknown as RegistrationOnboardingValues["gender"]) ||
              "",
            userCategory:
              (userData.userCategory as unknown as RegistrationOnboardingValues["userCategory"]) ||
              "",
            schoolName: userData.schoolName ?? "",
            schoolClass: userData.schoolClass ?? "",
            schoolAddress: userData.schoolAddress ?? "",
            collegeId: userData.collegeId ?? "",
            collegeName: userData.collegeName ?? "",
            collegeSkipped: userData.collegeSkipped ?? false,
            companyName: userData.companyName ?? "",
            jobTitle: userData.jobTitle ?? "",
            locationCoords: userData.locationCoords ?? "",
            locationState: userData.locationState ?? "",
            locationCountry: userData.locationCountry ?? "India",
            interests: userData.interests ?? [],
            skills: userData.skills ?? [],
            experienceLevel:
              (userData.experienceLevel as unknown as RegistrationOnboardingValues["experienceLevel"]) ||
              "",
            teamPreference:
              (userData.teamPreference as unknown as RegistrationOnboardingValues["teamPreference"]) ||
              "",
          });
        }
      }
    };

    void load();
  }, [isOpen, userData, fields, showOnboarding, getToken, supportedFields]);

  const handleFileSelect = async (
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to upload files");
        return;
      }

      const presign = await presignDocumentUpload(token, {
        purpose: "OPPORTUNITY_ATTACHMENT",
        mimeType: file.type,
        fileName: file.name,
      });

      await uploadDocumentToS3PresignedPost({
        presign,
        file,
      });

      const fileData = {
        url: presign.publicUrl,
        name: file.name,
      };

      setUploadedFiles((prev) => ({ ...prev, [fieldId]: fileData }));
      setValue(fieldId, presign.publicUrl);

      toast.success("Document uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(getApiErrorMessage(error, "Failed to upload document"));
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

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

  const handleOnboardingChange = (next: RegistrationOnboardingValues) => {
    setOnboardingValues((prev) => {
      if (next.userCategory && next.userCategory !== prev.userCategory) {
        return clearRegistrationOnboardingForCategory(
          next,
          next.userCategory as UserCategoryValue,
        );
      }
      return next;
    });
    setOnboardingErrors({});
  };

  const validate = (): boolean => {
    const newErrors: FieldErrors = {};

    // Determine current user category
    const currentUserCategory = showOnboarding
      ? onboardingValues.userCategory
      : userData?.userCategory;
    const isWorkingProfessional =
      currentUserCategory === UserCategory.WORKING_PROFESSIONAL;

    // Validate Registration Fields
    for (const field of supportedFields) {
      // Skip college fields for working professionals
      const isCollegeField = isCollegeFieldLabel(field.label);
      if (isCollegeField && isWorkingProfessional) {
        continue;
      }

      // Skip college field in registration fields if it's already shown in onboarding
      if (isCollegeField && showOnboarding) {
        const isCollegeCategory =
          currentUserCategory === UserCategory.COLLEGE_STUDENT ||
          currentUserCategory === UserCategory.PROFESSIONAL_SCHOOL_STUDENT ||
          currentUserCategory === UserCategory.FRESHER;
        if (isCollegeCategory) {
          continue; // Already validated in onboarding section
        }
      }

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
    if (showOnboarding) {
      const onboardingValidation =
        validateRegistrationOnboarding(onboardingValues);
      if (!onboardingValidation.isValid) {
        setOnboardingErrors(onboardingValidation.errors);
        return false;
      }
      setOnboardingErrors({});
    }

    return isRegistrationValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please complete all required fields.");
      return;
    }

    const rawValues: Record<string, unknown> = { ...values };
    if (showOnboarding) {
      const injected = injectOnboardingIntoRegistrationAnswers(
        rawValues,
        onboardingValues,
      );
      Object.assign(rawValues, injected);
    }

    const mergedFieldIds = new Set(supportedFields.map((f) => f.id));
    const answers = buildRegistrationSubmissionAnswers(
      rawValues,
      mergedFieldIds,
    ) as Array<{ fieldId: string; value: string | number | string[] }>;

    if (showOnboarding) {
      const token = await getToken();
      if (token) {
        try {
          const me = await getMe(token);
          const onboardingDto = buildCreateOnboardingDtoFromRegistration({
            onboarding: onboardingValues,
            answers: rawValues,
            profile: me.onboardingProfile,
          });
          await submitOnboarding(token, onboardingDto);

          const fullName = rawValues["default-name"];
          if (typeof fullName === "string") {
            const nameUpdate = buildProfileNameUpdate(fullName, {
              firstName: me.firstName,
              lastName: me.lastName,
            });
            if (nameUpdate) await updateProfile(token, nameUpdate);
          }
        } catch (err) {
          toast.error(getApiErrorMessage(err, "Could not save your profile."));
          return;
        }
      }

      const filteredOnboardingData: OnboardingValues = {
        gender: onboardingValues.gender as Gender | undefined,
        userCategory: onboardingValues.userCategory as UserCategory | undefined,
        interests: onboardingValues.interests,
        skills: onboardingValues.skills,
        experienceLevel:
          onboardingValues.experienceLevel as ExperienceLevel | undefined,
        teamPreference:
          onboardingValues.teamPreference as TeamPreference | undefined,
        schoolName: onboardingValues.schoolName,
        schoolClass: onboardingValues.schoolClass,
        schoolAddress: onboardingValues.schoolAddress,
        collegeId: onboardingValues.collegeId,
        collegeName: onboardingValues.collegeName,
        collegeSkipped: onboardingValues.collegeSkipped,
        companyName: onboardingValues.companyName,
        jobTitle: onboardingValues.jobTitle,
      };
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

  const isCollegeFieldLabel = (label: string) => {
    const l = label.toLowerCase();
    return (
      l.includes("college") ||
      l.includes("university") ||
      l.includes("institution")
    );
  };

  const renderOnboardingFields = () => (
    <RegistrationOnboardingFields
      values={onboardingValues}
      onChange={handleOnboardingChange}
      errors={onboardingErrors}
      showTeamPreference={false}
      compact
    />
  );

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

      case "ATTACHMENTS": {
        const fileData = uploadedFiles[field.id];

        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>

            <div className="flex flex-col gap-3">
              {fileData ? (
                <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                    <span className="text-sm text-primary-900 truncate">
                      {fileData.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-primary-600 hover:text-primary-700 hover:bg-primary-100"
                    onClick={() => {
                      setUploadedFiles((prev) => {
                        const next = { ...prev };
                        delete next[field.id];
                        return next;
                      });
                      setValue(field.id, "");
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    id={field.id}
                    type="file"
                    className="cursor-pointer file:cursor-pointer file:bg-primary-50 file:text-primary-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 file:hover:bg-primary-100 transition-colors"
                    onChange={(e) => handleFileSelect(field.id, e)}
                    disabled={isUploading}
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  />
                  {isUploading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      }

      case "TEXT":
      default: {
        const isCollegeField = isCollegeFieldLabel(field.label);

        // Hide college field for working professionals
        const currentUserCategory = showOnboarding
          ? onboardingValues.userCategory
          : userData?.userCategory;
        const isWorkingProfessional =
          currentUserCategory === UserCategory.WORKING_PROFESSIONAL;

        // Skip rendering college field for working professionals
        if (isCollegeField && isWorkingProfessional) {
          return null;
        }

        // Hide college field in registration fields if it's already shown in onboarding
        // This ensures college field appears right after User Category, not at the end
        if (isCollegeField && showOnboarding) {
          const isCollegeCategory =
            currentUserCategory === UserCategory.COLLEGE_STUDENT ||
            currentUserCategory === UserCategory.PROFESSIONAL_SCHOOL_STUDENT ||
            currentUserCategory === UserCategory.FRESHER;
          if (isCollegeCategory) {
            return null; // Already shown in onboarding section
          }
        }

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

        {/* Onboarding Fields - Render first so User Category appears before other fields */}
        {showOnboarding && renderOnboardingFields()}

        {/* Render supported fields - After onboarding so User Category is selected first */}
        {supportedFields.map((field) => renderField(field))}

        {/* Submit button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting || isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting || isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isUploading ? "Uploading..." : "Registering..."}
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
