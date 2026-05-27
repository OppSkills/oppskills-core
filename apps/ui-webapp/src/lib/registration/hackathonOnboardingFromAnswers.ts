import type { CreateOnboardingDto, MeResponseDto } from "@oppskills/types";
import { GenderValue, UserCategoryValue } from "@oppskills/types/enums";

type OnboardingProfile = NonNullable<MeResponseDto["onboardingProfile"]>;

const GENDER_VALUES = new Set<string>(Object.values(GenderValue));
const CATEGORY_VALUES = new Set<string>(Object.values(UserCategoryValue));

function asGender(value: unknown): GenderValue {
  const s = typeof value === "string" ? value : String(value ?? "");
  if (GENDER_VALUES.has(s)) return s as GenderValue;
  throw new Error("Please select a valid gender.");
}

/**
 * Build CreateOnboardingDto from hackathon registration answers + existing profile.
 * Uses profile.userCategory when set; otherwise defaults to COLLEGE_STUDENT (same as merged fields fallback).
 */
export function buildCreateOnboardingDtoFromRegistration(args: {
  answers: Record<string, unknown>;
  profile: OnboardingProfile | null | undefined;
  firstName?: string | null;
  lastName?: string | null;
}): CreateOnboardingDto {
  const { answers, profile } = args;

  const genderRaw = answers["default-gender"] ?? profile?.gender;
  if (genderRaw === undefined || genderRaw === null || genderRaw === "") {
    throw new Error("Gender is required.");
  }
  const gender = asGender(genderRaw);

  let userCategory: UserCategoryValue;
  const catRaw = profile?.userCategory;
  if (catRaw && CATEGORY_VALUES.has(catRaw)) {
    userCategory = catRaw as UserCategoryValue;
  } else {
    userCategory = UserCategoryValue.COLLEGE_STUDENT;
  }

  const dto: CreateOnboardingDto = {
    gender,
    userCategory,
  };

  if (profile?.interests?.length) {
    dto.interests = [...profile.interests];
  }
  if (profile?.skills?.length) {
    dto.skills = [...profile.skills];
  }
  if (profile?.experienceLevel) {
    dto.experienceLevel = profile.experienceLevel;
  }
  if (profile?.teamPreference) {
    dto.teamPreference = profile.teamPreference;
  }
  if (profile?.locationCoords)
    dto.locationCoords = profile.locationCoords ?? undefined;
  if (profile?.locationState)
    dto.locationState = profile.locationState ?? undefined;
  if (profile?.locationCountry) {
    dto.locationCountry = profile.locationCountry ?? undefined;
  }

  switch (userCategory) {
    case UserCategoryValue.SCHOOL_STUDENT: {
      const schoolName =
        (answers["default-school-name"] as string) || profile?.schoolName || "";
      const schoolClass =
        (answers["default-school-class"] as string) ||
        profile?.schoolClass ||
        "";
      dto.schoolName = schoolName.trim();
      dto.schoolClass = schoolClass.trim();
      if (profile?.schoolAddress) {
        dto.schoolAddress = profile.schoolAddress ?? undefined;
      }
      break;
    }
    case UserCategoryValue.COLLEGE_STUDENT:
    case UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT:
    case UserCategoryValue.FRESHER: {
      const collegeName =
        (answers["default-college-name"] as string) ||
        profile?.college?.name ||
        "";
      dto.collegeName = collegeName.trim() || undefined;
      if (profile?.collegeId) {
        dto.collegeId = profile.collegeId;
      }
      if (profile?.collegeSkipped !== undefined) {
        dto.collegeSkipped = profile.collegeSkipped;
      }
      if (profile?.collegeCurrentYear) {
        dto.collegeCurrentYear = profile.collegeCurrentYear ?? undefined;
      }
      if (profile?.collegePassoutYear != null) {
        dto.collegePassoutYear = profile.collegePassoutYear;
      }
      break;
    }
    case UserCategoryValue.WORKING_PROFESSIONAL: {
      const companyName =
        (answers["default-company-name"] as string) ||
        profile?.companyName ||
        "";
      dto.companyName = companyName.trim() || undefined;
      if (profile?.jobTitle) {
        dto.jobTitle = profile.jobTitle ?? undefined;
      }
      break;
    }
    default:
      break;
  }

  return dto;
}

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
