import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * NOTE:
 * - We keep enum values uppercase to match Prisma enums directly.
 * - All money values are strings to avoid floating-point issues; Prisma accepts decimal as string.
 */

const HACKATHON_MODE_VALUES = ["ONLINE", "OFFLINE", "HYBRID"] as const;
export type HackathonModeValue = (typeof HACKATHON_MODE_VALUES)[number];

const VISIBILITY_VALUES = ["PUBLIC", "PRIVATE", "UNIVERSITY_ONLY"] as const;
export type VisibilityValue = (typeof VISIBILITY_VALUES)[number];

const HACKATHON_TYPE_VALUES = [
  "CODING_HACKATHON",
  "IDEA_HACKATHON",
  "CASE_STUDY_COMPETITION",
  "DESIGN_HACKATHON",
  "OPEN_HACKATHON",
] as const;
export type HackathonTypeValue = (typeof HACKATHON_TYPE_VALUES)[number];

const PARTICIPANT_TYPE_VALUES = [
  "INDIVIDUAL",
  "TEAM_OF_2",
  "TEAM_OF_3",
  "TEAM_OF_4",
  "TEAM_OF_5",
  "TEAM_OF_6",
  "MORE_THAN_6",
] as const;
export type ParticipantTypeValue = (typeof PARTICIPANT_TYPE_VALUES)[number];

const LOCATION_TYPE_VALUES = ["PHYSICAL", "VIRTUAL"] as const;
export type LocationTypeValue = (typeof LOCATION_TYPE_VALUES)[number];

const REGISTRATION_FIELD_TYPE_VALUES = [
  "TEXT",
  "PHONE_NO",
  "EMAIL",
  "NUMBER",
  "ATTACHMENTS",
  "OPTIONS",
] as const;
export type RegistrationFieldTypeValue =
  (typeof REGISTRATION_FIELD_TYPE_VALUES)[number];

const LIFECYCLE_STATUS_VALUES = [
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
] as const;
export type HackathonLifecycleStatusValue =
  (typeof LIFECYCLE_STATUS_VALUES)[number];

export class HackathonLocationDto {
  /** Location type for the hackathon. */
  @IsString()
  @IsIn(LOCATION_TYPE_VALUES)
  type: LocationTypeValue;

  /** Physical address (required when type=PHYSICAL). */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  /** City (optional, used for search/filter). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  /** Virtual meeting link (required when type=VIRTUAL). */
  @IsOptional()
  @IsUrl()
  virtualLink?: string;
}

export class PrizeBreakdownDto {
  @IsString()
  @MaxLength(60)
  position: string;

  /**
   * Decimal string e.g. "1000.00"
   * Stored as Decimal(12,2) in DB.
   */
  @IsString()
  @MaxLength(40)
  amount: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class RegistrationFieldDto {
  @IsString()
  @MaxLength(120)
  label: string;

  @IsString()
  @IsIn(REGISTRATION_FIELD_TYPE_VALUES)
  type: RegistrationFieldTypeValue;

  @IsBoolean()
  required: boolean;

  @IsInt()
  @Min(0)
  order: number;

  /** Only relevant when type=OPTIONS */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(160)
  placeholder?: string;
}

export class RegistrationFormDto {
  @IsOptional()
  @IsUrl()
  externalFormLink?: string;

  /**
   * If you provide `externalFormLink`, `fields` becomes optional.
   * Otherwise, `fields` is required and validated.
   */
  @IsOptional()
  @ValidateIf((value: RegistrationFormDto) => !value.externalFormLink)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrationFieldDto)
  fields?: RegistrationFieldDto[];
}

export class RoundDto {
  @IsString()
  @MaxLength(120)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  /** ISO datetime string */
  @IsDateString()
  startsAt: string;

  @IsInt()
  @Min(0)
  order: number;
}

/**
 * Create a hackathon as a user.
 * - Initial status is always DRAFT (user can later publish).
 * - Admin approval/rejection happens via separate endpoints.
 */
export class CreateHackathonDto {
  // Basic Details
  @IsString()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  /**
   * Optional parent festival. If not provided, hackathon is standalone.
   * (NULL in DB means "Individual Hackathon")
   */
  @IsOptional()
  @IsString()
  festivalId?: string;

  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string;

  // Core dates & mode (existing fields)
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  @IsIn(HACKATHON_MODE_VALUES)
  mode: HackathonModeValue;

  // Configuration
  @IsOptional()
  @IsString()
  @IsIn(VISIBILITY_VALUES)
  visibility?: VisibilityValue;

  @IsOptional()
  @IsString()
  @IsIn(HACKATHON_TYPE_VALUES)
  hackathonType?: HackathonTypeValue;

  @IsOptional()
  @IsString()
  @IsIn(PARTICIPANT_TYPE_VALUES)
  participantType?: ParticipantTypeValue;

  // Location
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonLocationDto)
  location?: HackathonLocationDto;

  // Registration
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsUrl()
  externalRegistrationLink?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationFormDto)
  registrationForm?: RegistrationFormDto;

  // Pricing & Prizes
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  /** Decimal string e.g. "199.00" */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  entryFeeAmount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  /** Decimal string e.g. "10000.00" */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  prizeTotalWorthAmount?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => PrizeBreakdownDto)
  prizeBreakdown?: PrizeBreakdownDto[];

  // Organizer
  @IsOptional()
  @IsString()
  @MaxLength(180)
  organizationName?: string;

  @IsOptional()
  @IsUrl()
  organizationLogoUrl?: string;

  // University restriction
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUniversities?: string[];

  // Structure
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  rounds?: RoundDto[];
}

/**
 * Partial update payload for hackathons.
 * All fields are optional to support partial updates.
 */
export class UpdateHackathonDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsOptional()
  @IsString()
  festivalId?: string;

  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsIn(HACKATHON_MODE_VALUES)
  mode?: HackathonModeValue;

  @IsOptional()
  @IsString()
  @IsIn(VISIBILITY_VALUES)
  visibility?: VisibilityValue;

  @IsOptional()
  @IsString()
  @IsIn(HACKATHON_TYPE_VALUES)
  hackathonType?: HackathonTypeValue;

  @IsOptional()
  @IsString()
  @IsIn(PARTICIPANT_TYPE_VALUES)
  participantType?: ParticipantTypeValue;

  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonLocationDto)
  location?: HackathonLocationDto;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsUrl()
  externalRegistrationLink?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationFormDto)
  registrationForm?: RegistrationFormDto;

  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  entryFeeAmount?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  prizeTotalWorthAmount?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => PrizeBreakdownDto)
  prizeBreakdown?: PrizeBreakdownDto[];

  @IsOptional()
  @IsString()
  @MaxLength(180)
  organizationName?: string;

  @IsOptional()
  @IsUrl()
  organizationLogoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedUniversities?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  rounds?: RoundDto[];
}

/**
 * Update hackathon lifecycle status.
 * Allowed transitions are enforced on the backend.
 */
export class UpdateHackathonStatusDto {
  @IsString()
  @IsIn(LIFECYCLE_STATUS_VALUES)
  status: HackathonLifecycleStatusValue;
}
