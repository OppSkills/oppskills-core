import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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

/** Who can attend the hackathon (multi-select). */
const HACKATHON_ATTENDEE_ELIGIBILITY_VALUES = [
  "EVERYONE_CAN_APPLY",
  "SCHOOL_STUDENTS",
  "COLLEGE_STUDENTS",
  "FRESHERS",
  "PROFESSIONALS",
] as const;
export type HackathonAttendeeEligibilityValue =
  (typeof HACKATHON_ATTENDEE_ELIGIBILITY_VALUES)[number];

/** Type of application question for hackathon registration. */
const HACKATHON_QUESTION_TYPE_VALUES = [
  "QUESTION_ANSWER",
  "MCQ",
  "TRUE_FALSE",
] as const;
export type HackathonQuestionTypeValue =
  (typeof HACKATHON_QUESTION_TYPE_VALUES)[number];

/** Type of hackathon round (determines submission requirements). */
const HACKATHON_ROUND_TYPE_VALUES = ["ONLINE", "OFFLINE", "PRESENTATION"] as const;
export type HackathonRoundTypeValue =
  (typeof HACKATHON_ROUND_TYPE_VALUES)[number];

export class HackathonLocationDto {
  /** Location type for the hackathon. */
  @ApiProperty({ description: 'Location type (PHYSICAL or VIRTUAL)', enum: LOCATION_TYPE_VALUES })
  @IsString()
  @IsIn(LOCATION_TYPE_VALUES)
  type: LocationTypeValue;

  /** Physical address (required when type=PHYSICAL). */
  @ApiPropertyOptional({ description: 'Physical address (required when type=PHYSICAL)', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  /** City (optional, used for search/filter). */
  @ApiPropertyOptional({ description: 'City name for filtering', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  /** Virtual meeting link (required when type=VIRTUAL). */
  @ApiPropertyOptional({ description: 'Virtual meeting link (required when type=VIRTUAL)', format: 'uri' })
  @IsOptional()
  @IsUrl()
  virtualLink?: string;
}

export class PrizeBreakdownDto {
  @ApiProperty({ description: 'Prize position (e.g., "1st Place", "Runner-up")', maxLength: 60, example: '1st Place' })
  @IsString()
  @MaxLength(60)
  position: string;

  /**
   * Decimal string e.g. "1000.00"
   * Stored as Decimal(12,2) in DB.
   */
  @ApiProperty({ description: 'Prize amount as decimal string', maxLength: 40, example: '1000.00' })
  @IsString()
  @MaxLength(40)
  amount: string;

  @ApiPropertyOptional({ description: 'Prize description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

/**
 * Application question for hackathon registration.
 * Separate from registration form fields.
 */
export class HackathonQuestionDto {
  /** The question text */
  @IsString()
  @MaxLength(1000)
  questionText: string;

  /** Type of question (QUESTION_ANSWER, MCQ, TRUE_FALSE) */
  @IsString()
  @IsIn(HACKATHON_QUESTION_TYPE_VALUES)
  type: HackathonQuestionTypeValue;

  /** Whether this question is required */
  @IsBoolean()
  required: boolean;

  /** Order of the question (0-indexed) */
  @IsInt()
  @Min(0)
  order: number;

  /**
   * Options for MCQ questions.
   * Required when type=MCQ (minimum 2 options).
   * Ignored for other question types.
   */
  @IsOptional()
  @ValidateIf((obj: HackathonQuestionDto) => obj.type === "MCQ")
  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  options?: string[];
}

/**
 * Contact person information for hackathon additional info.
 */
export class HackathonContactDto {
  /** Contact person name */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  /** Contact email address */
  @IsOptional()
  @IsEmail()
  email?: string;

  /** Contact phone number */
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;
}

/**
 * Attachment for hackathon (S3-ready).
 * Stores storage key and optional metadata.
 */
export class HackathonAttachmentDto {
  /** Storage key for S3 or other storage provider */
  @IsString()
  @MaxLength(500)
  storageKey: string;

  /** Optional public URL (for direct access or CDN) */
  @IsOptional()
  @IsUrl()
  publicUrl?: string;

  /** Original file name */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  /** MIME type of the file */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  /** File size in bytes */
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;
}

/**
 * Additional info for hackathon (contact + attachments).
 */
export class HackathonAdditionalInfoDto {
  /** Contact person information */
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonContactDto)
  contact?: HackathonContactDto;

  /** Attachments (S3-ready) */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HackathonAttachmentDto)
  attachments?: HackathonAttachmentDto[];
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

/**
 * Submission configuration for a round.
 * Defines what participants need to submit for this round.
 */
export class RoundSubmissionConfigDto {
  /** Whether a file upload is required */
  @IsOptional()
  @IsBoolean()
  requiresFileUpload?: boolean;

  /** Allowed file types (e.g., ["pdf", "pptx", "zip"]) */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  /** Maximum file size in bytes */
  @IsOptional()
  @IsInt()
  @Min(1)
  maxFileSizeBytes?: number;

  /** Whether a link submission is required */
  @IsOptional()
  @IsBoolean()
  requiresLinkSubmission?: boolean;

  /** Whether a text description is required */
  @IsOptional()
  @IsBoolean()
  requiresDescription?: boolean;

  /** Custom instructions for the submission */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;
}

/**
 * Round definition for a hackathon.
 */
export class RoundDto {
  /** Round name (e.g., "Ideation Round", "Final Presentation") */
  @IsString()
  @MaxLength(120)
  name: string;

  /** Optional description of the round */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  /** ISO datetime string for round start */
  @IsDateString()
  startsAt: string;

  /** ISO datetime string for round end */
  @IsDateString()
  endsAt: string;

  /** Order of the round (0-indexed) */
  @IsInt()
  @Min(0)
  order: number;

  /** Type of round (ONLINE, OFFLINE, PRESENTATION) */
  @IsString()
  @IsIn(HACKATHON_ROUND_TYPE_VALUES)
  roundType: HackathonRoundTypeValue;

  /** Optional submission configuration for this round */
  @IsOptional()
  @ValidateNested()
  @Type(() => RoundSubmissionConfigDto)
  submissionConfig?: RoundSubmissionConfigDto;
}

/**
 * Create a hackathon as a user.
 * - Initial status is always DRAFT (user can later publish).
 * - Admin approval/rejection happens via separate endpoints.
 */
export class CreateHackathonDto {
  // Basic Details
  @ApiProperty({ description: 'Hackathon name', maxLength: 160, example: 'Tech Innovation Hackathon 2025' })
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({ description: 'Detailed hackathon description', maxLength: 20000 })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @ApiPropertyOptional({ description: 'URL-friendly slug', maxLength: 180, example: 'tech-innovation-2025' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  /**
   * Optional parent festival. If not provided, hackathon is standalone.
   * (NULL in DB means "Individual Hackathon")
   */
  @ApiPropertyOptional({ description: 'Parent festival ID (null for standalone hackathon)' })
  @IsOptional()
  @IsString()
  festivalId?: string;

  @ApiPropertyOptional({ description: 'Banner image URL', format: 'uri' })
  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string;

  // Core dates & mode (existing fields)
  @ApiProperty({ description: 'Hackathon start date (ISO 8601)', format: 'date-time', example: '2025-03-15T10:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Hackathon end date (ISO 8601)', format: 'date-time', example: '2025-03-17T18:00:00Z' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Hackathon mode', enum: HACKATHON_MODE_VALUES, example: 'HYBRID' })
  @IsString()
  @IsIn(HACKATHON_MODE_VALUES)
  mode: HackathonModeValue;

  // Configuration
  @ApiPropertyOptional({ description: 'Hackathon visibility', enum: VISIBILITY_VALUES, default: 'PUBLIC' })
  @IsOptional()
  @IsString()
  @IsIn(VISIBILITY_VALUES)
  visibility?: VisibilityValue;

  @ApiPropertyOptional({ description: 'Type of hackathon', enum: HACKATHON_TYPE_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(HACKATHON_TYPE_VALUES)
  hackathonType?: HackathonTypeValue;

  @ApiPropertyOptional({ description: 'Participant type/team size', enum: PARTICIPANT_TYPE_VALUES })
  @IsOptional()
  @IsString()
  @IsIn(PARTICIPANT_TYPE_VALUES)
  participantType?: ParticipantTypeValue;

  // Location
  @ApiPropertyOptional({ description: 'Location details', type: () => HackathonLocationDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonLocationDto)
  location?: HackathonLocationDto;

  // Registration
  @ApiPropertyOptional({ description: 'Registration deadline (ISO 8601)', format: 'date-time' })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiPropertyOptional({ description: 'External registration form link', format: 'uri' })
  @IsOptional()
  @IsUrl()
  externalRegistrationLink?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationFormDto)
  registrationForm?: RegistrationFormDto;

  // Pricing & Prizes
  @ApiPropertyOptional({ description: 'Whether the hackathon is free to enter', default: true })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  /** Decimal string e.g. "199.00" */
  @ApiPropertyOptional({ description: 'Entry fee amount (decimal string)', example: '199.00' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  entryFeeAmount?: string;

  @ApiPropertyOptional({ description: 'Currency code', maxLength: 8, example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  /** Decimal string e.g. "10000.00" */
  @ApiPropertyOptional({ description: 'Total prize pool worth (decimal string)', example: '10000.00' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  prizeTotalWorthAmount?: string;

  @ApiPropertyOptional({ description: 'Prize breakdown by position', type: [PrizeBreakdownDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => PrizeBreakdownDto)
  prizeBreakdown?: PrizeBreakdownDto[];

  /**
   * Rich text description for prizes (JSON format from editor like TipTap/Slate).
   * Stored as JSON in database.
   */
  @IsOptional()
  @IsObject()
  prizeDescription?: Record<string, string | number | boolean | null | object>;

  /** Whether prize certificates will be provided */
  @IsOptional()
  @IsBoolean()
  prizeCertificate?: boolean;

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

  // Eligibility & Team Settings
  /**
   * Who can attend this hackathon.
   * Defaults to ["EVERYONE_CAN_APPLY"] if not provided.
   */
  @ApiPropertyOptional({
    description: 'Who can attend this hackathon',
    enum: HACKATHON_ATTENDEE_ELIGIBILITY_VALUES,
    isArray: true,
    default: ['EVERYONE_CAN_APPLY']
  })
  @IsOptional()
  @IsArray()
  @IsIn(HACKATHON_ATTENDEE_ELIGIBILITY_VALUES, { each: true })
  attendeeEligibility?: HackathonAttendeeEligibilityValue[];

  /** Maximum number of teams allowed (null = unlimited) */
  @ApiPropertyOptional({ description: 'Maximum number of teams allowed (null = unlimited)', minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeams?: number;

  // Structure
  /**
   * Hackathon rounds.
   * If not provided, 3 default rounds will be created with evenly split timelines.
   */
  @ApiPropertyOptional({ description: 'Hackathon rounds (defaults to 3 rounds if not provided)', type: [RoundDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  rounds?: RoundDto[];

  // Application Questions
  /**
   * Application questions (separate from registration form).
   * Q/A, MCQ, or True/False questions.
   */
  @ApiPropertyOptional({ description: 'Application questions for registration', type: [HackathonQuestionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HackathonQuestionDto)
  questions?: HackathonQuestionDto[];

  // Additional Info
  /**
   * Additional info including contact person and attachments.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonAdditionalInfoDto)
  additionalInfo?: HackathonAdditionalInfoDto;
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

  /**
   * Rich text description for prizes (JSON format from editor like TipTap/Slate).
   */
  @IsOptional()
  @IsObject()
  prizeDescription?: Record<string, string | number | boolean | null | object>;

  /** Whether prize certificates will be provided */
  @IsOptional()
  @IsBoolean()
  prizeCertificate?: boolean;

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

  // Eligibility & Team Settings
  /**
   * Who can attend this hackathon.
   */
  @IsOptional()
  @IsArray()
  @IsIn(HACKATHON_ATTENDEE_ELIGIBILITY_VALUES, { each: true })
  attendeeEligibility?: HackathonAttendeeEligibilityValue[];

  /** Maximum number of teams allowed (null = unlimited) */
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeams?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  rounds?: RoundDto[];

  // Application Questions
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HackathonQuestionDto)
  questions?: HackathonQuestionDto[];

  // Additional Info
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonAdditionalInfoDto)
  additionalInfo?: HackathonAdditionalInfoDto;
}

/**
 * DTO for replacing all rounds of a hackathon.
 */
export class UpdateHackathonRoundsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  rounds: RoundDto[];
}

/**
 * DTO for replacing all questions of a hackathon.
 */
export class UpdateHackathonQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HackathonQuestionDto)
  questions: HackathonQuestionDto[];
}

/**
 * DTO for updating additional info (contact + attachments) of a hackathon.
 */
export class UpdateHackathonAdditionalInfoDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonContactDto)
  contact?: HackathonContactDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HackathonAttachmentDto)
  attachments?: HackathonAttachmentDto[];
}

/**
 * Update hackathon lifecycle status.
 * Allowed transitions are enforced on the backend.
 */
export class UpdateHackathonStatusDto {
  @ApiProperty({
    description: 'New lifecycle status',
    enum: LIFECYCLE_STATUS_VALUES,
    example: 'PUBLISHED'
  })
  @IsString()
  @IsIn(LIFECYCLE_STATUS_VALUES)
  status: HackathonLifecycleStatusValue;
}
