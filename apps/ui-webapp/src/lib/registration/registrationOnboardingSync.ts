import type { CreateOnboardingDto, MeResponseDto } from "@oppskills/types";
import {
  GenderValue,
  UserCategoryValue,
  ExperienceLevelValue,
  TeamPreferenceValue,
} from "@oppskills/types/enums";
import {
  EMPTY_REGISTRATION_ONBOARDING,
  type RegistrationOnboardingErrors,
  type RegistrationOnboardingValues,
} from "./registrationOnboardingTypes";

type OnboardingProfile = NonNullable<MeResponseDto["onboardingProfile"]>;

const GENDER_VALUES = new Set<string>(Object.values(GenderValue));
const CATEGORY_VALUES = new Set<string>(Object.values(UserCategoryValue));

function asGender(value: unknown): GenderValue {
  const s = typeof value === "string" ? value : String(value ?? "");
  if (GENDER_VALUES.has(s)) return s as GenderValue;
  throw new Error("Please select a valid gender.");
}

function asCategory(value: unknown): UserCategoryValue {
  const s = typeof value === "string" ? value : String(value ?? "");
  if (CATEGORY_VALUES.has(s)) return s as UserCategoryValue;
  throw new Error("Please select your user type.");
}

/** Prefill onboarding form state from user + onboarding profile. */
export function prefillRegistrationOnboarding(args: {
  me: MeResponseDto;
  phone?: string | null;
}): RegistrationOnboardingValues {
  const profile = args.me.onboardingProfile;
  const base = { ...EMPTY_REGISTRATION_ONBOARDING };

  if (!profile) return base;

  return {
    ...base,
    gender: (profile.gender as GenderValue) || "",
    userCategory: (profile.userCategory as UserCategoryValue) || "",
    schoolName: profile.schoolName ?? "",
    schoolClass: profile.schoolClass ?? "",
    schoolAddress: profile.schoolAddress ?? "",
    collegeId: profile.collegeId ?? profile.college?.id ?? "",
    collegeName: profile.college?.name ?? "",
    collegeCurrentYear: profile.collegeCurrentYear ?? "",
    collegePassoutYear:
      profile.collegePassoutYear != null
        ? String(profile.collegePassoutYear)
        : "",
    collegeSkipped: profile.collegeSkipped ?? false,
    companyName: profile.companyName ?? "",
    jobTitle: profile.jobTitle ?? "",
    locationCoords: profile.locationCoords ?? "",
    locationState: profile.locationState ?? "",
    locationCountry: profile.locationCountry ?? "India",
    interests: profile.interests ?? [],
    skills: profile.skills ?? [],
    experienceLevel: (profile.experienceLevel as ExperienceLevelValue) || "",
    teamPreference: (profile.teamPreference as TeamPreferenceValue) || "",
  };
}

/** Clear category-specific fields when user type changes (mirrors onboarding page). */
export function clearRegistrationOnboardingForCategory(
  values: RegistrationOnboardingValues,
  nextCategory: UserCategoryValue | "",
): RegistrationOnboardingValues {
  const cleared = { ...values, userCategory: nextCategory };

  switch (nextCategory) {
    case UserCategoryValue.WORKING_PROFESSIONAL:
      return {
        ...cleared,
        collegeId: "",
        collegeName: "",
        collegeCurrentYear: "",
        collegePassoutYear: "",
        collegeSkipped: false,
        schoolName: "",
        schoolClass: "",
        schoolAddress: "",
      };
    case UserCategoryValue.FRESHER:
      return {
        ...cleared,
        schoolName: "",
        schoolClass: "",
        schoolAddress: "",
        companyName: "",
        jobTitle: "",
      };
    case UserCategoryValue.COLLEGE_STUDENT:
    case UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT:
      return {
        ...cleared,
        schoolName: "",
        schoolClass: "",
        schoolAddress: "",
        companyName: "",
        jobTitle: "",
      };
    case UserCategoryValue.SCHOOL_STUDENT:
      return {
        ...cleared,
        collegeId: "",
        collegeName: "",
        collegeCurrentYear: "",
        collegePassoutYear: "",
        collegeSkipped: false,
        companyName: "",
        jobTitle: "",
      };
    default:
      return cleared;
  }
}

export function validateRegistrationOnboarding(
  values: RegistrationOnboardingValues,
): { isValid: boolean; errors: RegistrationOnboardingErrors } {
  const errors: RegistrationOnboardingErrors = {};

  if (!values.gender) errors.gender = "Gender is required";
  if (!values.userCategory) errors.userCategory = "User type is required";

  switch (values.userCategory) {
    case UserCategoryValue.SCHOOL_STUDENT:
      if (!values.schoolName.trim())
        errors.schoolName = "School name is required";
      if (!values.schoolClass.trim()) errors.schoolClass = "Class is required";
      break;
    case UserCategoryValue.COLLEGE_STUDENT:
    case UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT:
      if (
        !values.collegeSkipped &&
        !values.collegeId &&
        !values.collegeName.trim()
      ) {
        errors.college = "College is required unless not listed";
      }
      break;
    case UserCategoryValue.WORKING_PROFESSIONAL:
      if (!values.companyName.trim()) {
        errors.companyName = "Company name is required";
      }
      if (!values.jobTitle.trim()) errors.jobTitle = "Job title is required";
      break;
    default:
      break;
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

/** Build onboarding DTO from registration modal state. */
export function buildCreateOnboardingDtoFromRegistration(args: {
  onboarding: RegistrationOnboardingValues;
  answers: Record<string, unknown>;
  profile?: OnboardingProfile | null;
}): CreateOnboardingDto {
  const { onboarding, answers, profile } = args;

  const genderRaw =
    onboarding.gender || answers["default-gender"] || profile?.gender;
  if (!genderRaw) throw new Error("Gender is required.");
  const gender = asGender(genderRaw);

  const categoryRaw =
    onboarding.userCategory ||
    profile?.userCategory ||
    UserCategoryValue.COLLEGE_STUDENT;
  const userCategory = asCategory(categoryRaw);

  const dto: CreateOnboardingDto = {
    gender,
    userCategory,
    interests: onboarding.interests.length
      ? [...onboarding.interests]
      : profile?.interests,
    skills: onboarding.skills.length ? [...onboarding.skills] : profile?.skills,
    experienceLevel:
      onboarding.experienceLevel || profile?.experienceLevel || undefined,
    teamPreference:
      onboarding.teamPreference || profile?.teamPreference || undefined,
    locationCoords:
      onboarding.locationCoords.trim() || profile?.locationCoords || undefined,
    locationState:
      onboarding.locationState.trim() || profile?.locationState || undefined,
    locationCountry:
      onboarding.locationCountry.trim() ||
      profile?.locationCountry ||
      undefined,
    locationPlaceId: onboarding.locationPlaceId || undefined,
  };

  const phone = answers["default-phone"];
  if (typeof phone === "string" && phone.trim()) {
    dto.mobileNumber = phone.trim();
  } else if (profile?.mobileNumber) {
    dto.mobileNumber = profile.mobileNumber;
  }

  switch (userCategory) {
    case UserCategoryValue.SCHOOL_STUDENT: {
      dto.schoolName =
        onboarding.schoolName.trim() ||
        (answers["default-school-name"] as string)?.trim() ||
        profile?.schoolName ||
        "";
      dto.schoolClass =
        onboarding.schoolClass.trim() ||
        (answers["default-school-class"] as string)?.trim() ||
        profile?.schoolClass ||
        "";
      dto.schoolAddress =
        onboarding.schoolAddress.trim() || profile?.schoolAddress || undefined;
      break;
    }
    case UserCategoryValue.COLLEGE_STUDENT:
    case UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT:
    case UserCategoryValue.FRESHER: {
      dto.collegeName =
        onboarding.collegeName.trim() ||
        (answers["default-college-name"] as string)?.trim() ||
        profile?.college?.name ||
        undefined;
      dto.collegeId = onboarding.collegeId || profile?.collegeId || undefined;
      dto.collegeSkipped = onboarding.collegeSkipped;
      dto.collegeCurrentYear =
        onboarding.collegeCurrentYear.trim() ||
        profile?.collegeCurrentYear ||
        undefined;
      if (onboarding.collegePassoutYear.trim()) {
        dto.collegePassoutYear = parseInt(onboarding.collegePassoutYear, 10);
      } else if (profile?.collegePassoutYear != null) {
        dto.collegePassoutYear = profile.collegePassoutYear;
      }
      break;
    }
    case UserCategoryValue.WORKING_PROFESSIONAL: {
      dto.companyName =
        onboarding.companyName.trim() ||
        (answers["default-company-name"] as string)?.trim() ||
        profile?.companyName ||
        undefined;
      dto.jobTitle =
        onboarding.jobTitle.trim() || profile?.jobTitle || undefined;
      break;
    }
    default:
      break;
  }

  return dto;
}

/** Split full name from registration into first/last for user table update. */
export function buildProfileNameUpdate(
  fullName: string,
  current?: { firstName?: string | null; lastName?: string | null },
): { firstName?: string; lastName?: string } | null {
  const trimmed = fullName.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ") || "";

  if (
    current?.firstName === firstName &&
    (current?.lastName ?? "") === lastName
  ) {
    return null;
  }

  return { firstName, lastName: lastName || undefined };
}

/** Inject identity answers expected by backend default-field mapping. */
export function injectOnboardingIntoRegistrationAnswers(
  answers: Record<string, unknown>,
  onboarding: RegistrationOnboardingValues,
): Record<string, unknown> {
  const merged = { ...answers };

  const setIf = (id: string, val: unknown) => {
    if (val !== undefined && val !== null && val !== "") {
      merged[id] = val;
    }
  };

  setIf("default-gender", onboarding.gender);

  switch (onboarding.userCategory) {
    case UserCategoryValue.SCHOOL_STUDENT:
      setIf("default-school-name", onboarding.schoolName);
      setIf("default-school-class", onboarding.schoolClass);
      break;
    case UserCategoryValue.COLLEGE_STUDENT:
    case UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT:
    case UserCategoryValue.FRESHER:
      setIf("default-college-name", onboarding.collegeName);
      break;
    case UserCategoryValue.WORKING_PROFESSIONAL:
      setIf("default-company-name", onboarding.companyName);
      break;
    default:
      break;
  }

  return merged;
}

/** Default field IDs collected in the onboarding block but required by the backend. */
export const REGISTRATION_ONBOARDING_DEFAULT_FIELD_IDS = [
  "default-gender",
  "default-school-name",
  "default-school-class",
  "default-college-name",
  "default-company-name",
] as const;

export function filterAnswersToMergedFieldIds(
  answers: Record<string, unknown>,
  mergedFieldIds: Set<string>,
): Array<{ fieldId: string; value: string }> {
  const out: Array<{ fieldId: string; value: string }> = [];
  for (const id of mergedFieldIds) {
    if (!(id in answers)) continue;
    const v = answers[id];
    out.push({
      fieldId: id,
      value: typeof v === "string" ? v : String(v ?? ""),
    });
  }
  return out;
}

/**
 * Build the payload sent to join/register APIs.
 * Includes visible form fields plus onboarding-injected default-* identity fields.
 */
export function buildRegistrationSubmissionAnswers(
  answers: Record<string, unknown>,
  mergedFieldIds: Set<string>,
): Array<{ fieldId: string; value: string }> {
  const submitIds = new Set([
    ...mergedFieldIds,
    ...REGISTRATION_ONBOARDING_DEFAULT_FIELD_IDS,
  ]);
  return filterAnswersToMergedFieldIds(answers, submitIds);
}
