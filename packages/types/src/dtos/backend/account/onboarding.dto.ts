import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { Type } from 'class-transformer';
import {
  GenderValue,
  UserCategoryValue,
  ExperienceLevelValue,
  TeamPreferenceValue,
} from '../../../enums';

/**
 * DTO for creating/updating user onboarding profile.
 */
export class CreateOnboardingDto {
  // Step 1: Primary Identity
  @IsEnum(GenderValue)
  @IsNotEmpty()
  gender: GenderValue;

  @IsEnum(UserCategoryValue)
  @IsNotEmpty()
  userCategory: UserCategoryValue;

  // Step 2: Education/Work Details
  // School fields (required for SCHOOL_STUDENT)
  @ValidateIf((o) => o.userCategory === UserCategoryValue.SCHOOL_STUDENT)
  @IsString()
  @IsNotEmpty()
  schoolName?: string;

  @ValidateIf((o) => o.userCategory === UserCategoryValue.SCHOOL_STUDENT)
  @IsString()
  @IsNotEmpty()
  schoolClass?: string;

  @ValidateIf((o) => o.userCategory === UserCategoryValue.SCHOOL_STUDENT)
  @IsString()
  @IsOptional()
  schoolAddress?: string;

  // College fields (for COLLEGE_STUDENT, PROFESSIONAL_SCHOOL_STUDENT)
  @ValidateIf((o) =>
    [UserCategoryValue.COLLEGE_STUDENT, UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT].includes(o.userCategory) &&
    !o.collegeSkipped
  )
  @IsString()
  @IsNotEmpty()
  collegeId?: string;

  @ValidateIf((o) =>
    [UserCategoryValue.COLLEGE_STUDENT, UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT].includes(o.userCategory)
  )
  @IsString()
  @IsOptional()
  collegeCurrentYear?: string;

  @ValidateIf((o) =>
    [UserCategoryValue.COLLEGE_STUDENT, UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT].includes(o.userCategory)
  )
  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  collegePassoutYear?: number;

  @IsOptional()
  collegeSkipped?: boolean;

  // Working professional fields (for WORKING_PROFESSIONAL)
  @ValidateIf((o) => o.userCategory === UserCategoryValue.WORKING_PROFESSIONAL)
  @IsString()
  @IsOptional()
  companyName?: string;

  @ValidateIf((o) => o.userCategory === UserCategoryValue.WORKING_PROFESSIONAL)
  @IsString()
  @IsOptional()
  jobTitle?: string;

  // Step 3: Location (required)
  @IsString()
  @IsNotEmpty()
  locationCity: string;

  @IsString()
  @IsNotEmpty()
  locationState: string;

  @IsString()
  @IsNotEmpty()
  locationCountry: string;

  // Step 4: Interests and Skills
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  // Step 5: Experience Level (optional)
  @IsEnum(ExperienceLevelValue)
  @IsOptional()
  experienceLevel?: ExperienceLevelValue;

  // Step 6: Team Preference (optional)
  @IsEnum(TeamPreferenceValue)
  @IsOptional()
  teamPreference?: TeamPreferenceValue;
}

/**
 * DTO for updating user onboarding profile (all fields optional).
 */
export class UpdateOnboardingDto {
  @IsEnum(GenderValue)
  @IsOptional()
  gender?: GenderValue;

  @IsEnum(UserCategoryValue)
  @IsOptional()
  userCategory?: UserCategoryValue;

  @IsString()
  @IsOptional()
  schoolName?: string;

  @IsString()
  @IsOptional()
  schoolClass?: string;

  @IsString()
  @IsOptional()
  schoolAddress?: string;

  @IsString()
  @IsOptional()
  collegeId?: string;

  @IsString()
  @IsOptional()
  collegeCurrentYear?: string;

  @IsInt()
  @Min(1900)
  @Max(2100)
  @IsOptional()
  @Type(() => Number)
  collegePassoutYear?: number;

  @IsOptional()
  collegeSkipped?: boolean;

  @IsString()
  @IsOptional()
  companyName?: string;

  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  locationCity?: string;

  @IsString()
  @IsOptional()
  locationState?: string;

  @IsString()
  @IsOptional()
  locationCountry?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsEnum(ExperienceLevelValue)
  @IsOptional()
  experienceLevel?: ExperienceLevelValue;

  @IsEnum(TeamPreferenceValue)
  @IsOptional()
  teamPreference?: TeamPreferenceValue;
}

/**
 * Response DTO for user onboarding profile.
 */
export interface OnboardingProfileResponseDto {
  id: string;
  userId: string;
  gender: GenderValue;
  userCategory: UserCategoryValue;
  schoolName?: string | null;
  schoolClass?: string | null;
  schoolAddress?: string | null;
  collegeId?: string | null;
  // College relation for prefilling registration forms
  college?: {
    id: string;
    name: string;
  } | null;
  collegeCurrentYear?: string | null;
  collegePassoutYear?: number | null;
  collegeSkipped: boolean;
  companyName?: string | null;
  jobTitle?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  locationCountry?: string | null;
  interests: string[];
  skills: string[];
  experienceLevel?: ExperienceLevelValue | null;
  teamPreference?: TeamPreferenceValue | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for GET /user-accounts/me endpoint.
 */
export interface MeResponseDto {
  id: string;
  email: string;
  imageUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  accessLevel: string;
  onboarded: boolean;
  onboardingProfile?: OnboardingProfileResponseDto | null;
  createdAt: Date;
  updatedAt: Date;
}
