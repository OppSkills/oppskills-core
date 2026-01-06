import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsIn,
  IsInt,
  IsNumber,
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
  "TEAM_OF_2_3",
  "TEAM_OF_2_4",
  "TEAM_OF_3_4",
  "TEAM_OF_3_5",
  "TEAM_OF_4_5",
  "TEAM_OF_4_6",
  "TEAM_OF_5_6",
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

/** Type of hackathon round (determines submission requirements). */
const HACKATHON_ROUND_TYPE_VALUES = [
  "ONLINE",
  "OFFLINE",
  "PRESENTATION",
] as const;
export type HackathonRoundTypeValue =
  (typeof HACKATHON_ROUND_TYPE_VALUES)[number];

export class HackathonLocationDto {
  /** Location type for the hackathon. */
  @ApiProperty({
    description: "Location type (PHYSICAL or VIRTUAL)",
    enum: LOCATION_TYPE_VALUES,
    example: "PHYSICAL",
  })
  @IsString()
  @IsIn(LOCATION_TYPE_VALUES)
  type: LocationTypeValue;

  /** Physical address (required when type=PHYSICAL). */
  @ApiPropertyOptional({
    description: "Physical address (required when type=PHYSICAL)",
    maxLength: 500,
    example: "456 Tech Park Ave, Building 3, Austin, TX 78701",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  /** City (optional, used for search/filter). */
  @ApiPropertyOptional({
    description: "City name for filtering",
    maxLength: 120,
    example: "Austin",
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  /** Virtual meeting link (required when type=VIRTUAL). */
  @ApiPropertyOptional({
    description: "Virtual meeting link (required when type=VIRTUAL)",
    format: "uri",
    example: "https://meet.google.com/abc-defg-hij",
  })
  @IsOptional()
  @IsUrl()
  virtualLink?: string;
}

export class PrizeBreakdownDto {
  @ApiProperty({
    description: 'Prize position (e.g., "1st Place", "Runner-up")',
    maxLength: 60,
    example: "1st Place",
  })
  @IsString()
  @MaxLength(60)
  position: string;

  /**
   * Decimal string e.g. "1000.00"
   * Stored as Decimal(12,2) in DB.
   */
  @ApiProperty({
    description: "Prize amount as decimal string",
    maxLength: 40,
    example: "1000.00",
  })
  @IsString()
  @MaxLength(40)
  amount: string;

  @ApiPropertyOptional({ description: "Prize description", maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

/**
 * Application question for hackathon registration.
 * Separate from registration form fields.
 */
/**
 * Contact person information for hackathon additional info.
 */
export class HackathonContactDto {
  /** Contact person name */
  @ApiPropertyOptional({
    description: "Contact person name",
    maxLength: 120,
    example: "Jane Smith",
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  /** Contact email address */
  @ApiPropertyOptional({
    description: "Contact email address",
    format: "email",
    example: "jane.smith@techcorp.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  /** Contact phone number */
  @ApiPropertyOptional({
    description: "Contact phone number",
    maxLength: 20,
    example: "+1-555-123-4567",
  })
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
  @ApiProperty({
    description: "Storage key for S3 or other storage provider",
    maxLength: 500,
    example: "hackathons/2025/tech-innovation/rules.pdf",
  })
  @IsString()
  @MaxLength(500)
  storageKey: string;

  /** Optional public URL (for direct access or CDN) */
  @ApiPropertyOptional({
    description: "Optional public URL (for direct access or CDN)",
    format: "uri",
    example:
      "https://cdn.oppskills.com/hackathons/2025/tech-innovation/rules.pdf",
  })
  @IsOptional()
  @IsUrl()
  publicUrl?: string;

  /** Original file name */
  @ApiPropertyOptional({
    description: "Original file name",
    maxLength: 255,
    example: "hackathon-rules-2025.pdf",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  /** MIME type of the file */
  @ApiPropertyOptional({
    description: "MIME type of the file",
    maxLength: 100,
    example: "application/pdf",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;

  /** File size in bytes */
  @ApiPropertyOptional({
    description: "File size in bytes",
    minimum: 0,
    example: 524288,
  })
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
  @ApiPropertyOptional({
    description: "Contact person information",
    type: () => HackathonContactDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonContactDto)
  contact?: HackathonContactDto;

  /** Attachments (S3-ready) */
  @ApiPropertyOptional({
    description: "Attachments (S3-ready)",
    type: [HackathonAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HackathonAttachmentDto)
  attachments?: HackathonAttachmentDto[];
}

export class RegistrationFieldDto {
  @ApiProperty({
    description: "Field label",
    maxLength: 120,
    example: "University Name",
  })
  @IsString()
  @MaxLength(120)
  label: string;

  @ApiProperty({
    description: "Field type",
    enum: REGISTRATION_FIELD_TYPE_VALUES,
    example: "TEXT",
  })
  @IsString()
  @IsIn(REGISTRATION_FIELD_TYPE_VALUES)
  type: RegistrationFieldTypeValue;

  @ApiProperty({
    description: "Whether this field is required",
    example: true,
  })
  @IsBoolean()
  required: boolean;

  @ApiProperty({
    description: "Display order of the field (0-indexed)",
    minimum: 0,
    example: 0,
  })
  @IsInt()
  @Min(0)
  order: number;

  /** Only relevant when type=OPTIONS */
  @ApiPropertyOptional({
    description: "Available options (only relevant when type=OPTIONS)",
    type: [String],
    example: ["Option A", "Option B", "Option C"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({
    description: "Placeholder text for the field",
    maxLength: 160,
    example: "Enter your university name",
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  placeholder?: string;
}

export class RegistrationFormDto {
  @ApiPropertyOptional({
    description: "External form link (e.g., Google Forms, Typeform)",
    format: "uri",
    example: "https://forms.google.com/hackathon-registration",
  })
  @IsOptional()
  @IsUrl()
  externalFormLink?: string;

  /**
   * If you provide `externalFormLink`, `fields` becomes optional.
   * Otherwise, `fields` is required and validated.
   */
  @ApiPropertyOptional({
    description:
      "Custom registration fields (optional if externalFormLink is provided)",
    type: [RegistrationFieldDto],
  })
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
  @ApiPropertyOptional({
    description: "Whether a file upload is required",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  requiresFileUpload?: boolean;

  /** Allowed file types (e.g., ["pdf", "pptx", "zip"]) */
  @ApiPropertyOptional({
    description: "Allowed file types",
    type: [String],
    example: ["pdf", "pptx", "zip"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedFileTypes?: string[];

  /** Maximum file size in bytes */
  @ApiPropertyOptional({
    description: "Maximum file size in bytes",
    minimum: 1,
    example: 10485760,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxFileSizeBytes?: number;

  /** Whether a link submission is required */
  @ApiPropertyOptional({
    description: "Whether a link submission is required",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  requiresLinkSubmission?: boolean;

  /** Whether a text description is required */
  @ApiPropertyOptional({
    description: "Whether a text description is required",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  requiresDescription?: boolean;

  /** Custom instructions for the submission */
  @ApiPropertyOptional({
    description: "Custom instructions for the submission",
    maxLength: 2000,
    example:
      "Please submit your project presentation and a demo video link. Ensure all files are properly labeled.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  instructions?: string;
}

/**
 * Round definition for a hackathon.
 */
export class RoundDto {
  /** Optional round ID for updates (omit for new rounds) */
  @ApiPropertyOptional({
    description:
      "Round ID for updates. Omit when creating new rounds. Required when updating existing rounds.",
    example: "clx1234567890",
  })
  @IsOptional()
  @IsString()
  id?: string;

  /** Round name (e.g., "Ideation Round", "Final Presentation") */
  @ApiProperty({
    description: "Round name",
    maxLength: 120,
    example: "Final Presentation",
  })
  @IsString()
  @MaxLength(120)
  name: string;

  /** Optional description of the round */
  @ApiPropertyOptional({
    description: "Optional description of the round",
    maxLength: 5000,
    example:
      "Present your final project to the judges. Each team gets 10 minutes for presentation and 5 minutes for Q&A.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  /** ISO datetime string for round start */
  @ApiProperty({
    description: "ISO datetime string for round start",
    format: "date-time",
    example: "2025-03-17T09:00:00Z",
  })
  @IsDateString()
  startsAt: string;

  /** ISO datetime string for round end */
  @ApiProperty({
    description: "ISO datetime string for round end",
    format: "date-time",
    example: "2025-03-17T17:00:00Z",
  })
  @IsDateString()
  endsAt: string;

  /** Order of the round (0-indexed) */
  @ApiProperty({
    description: "Order of the round (0-indexed)",
    minimum: 0,
    example: 2,
  })
  @IsInt()
  @Min(0)
  order: number;

  /** Type of round (ONLINE, OFFLINE, PRESENTATION) */
  @ApiProperty({
    description: "Type of round",
    enum: HACKATHON_ROUND_TYPE_VALUES,
    example: "PRESENTATION",
  })
  @IsString()
  @IsIn(HACKATHON_ROUND_TYPE_VALUES)
  roundType: HackathonRoundTypeValue;

  /** Optional submission configuration for this round */
  @ApiPropertyOptional({
    description: "Optional submission configuration for this round",
    type: () => RoundSubmissionConfigDto,
  })
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
  @ApiProperty({
    description: "Hackathon name",
    maxLength: 160,
    example: "Tech Innovation Hackathon 2025",
  })
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({
    description: "Detailed hackathon description",
    maxLength: 20000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @ApiPropertyOptional({
    description: "URL-friendly slug",
    maxLength: 180,
    example: "tech-innovation-2025",
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  /**
   * Optional parent festival. If not provided, hackathon is standalone.
   * (NULL in DB means "Individual Hackathon")
   */
  @ApiPropertyOptional({
    description: "Parent festival ID (null for standalone hackathon)",
    format: "uuid",
    example: "550e8400-e29b-41d4-a716-446655440002",
  })
  @IsOptional()
  @IsString()
  festivalId?: string;

  @ApiPropertyOptional({
    description: "Banner image URL",
    format: "uri",
    example:
      "https://cdn.oppskills.com/hackathons/tech-innovation-2025-banner.jpg",
  })
  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string;

  // Core dates & mode (existing fields)
  @ApiProperty({
    description: "Hackathon start date (ISO 8601)",
    format: "date-time",
    example: "2025-03-15T10:00:00Z",
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: "Hackathon end date (ISO 8601)",
    format: "date-time",
    example: "2025-03-17T18:00:00Z",
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: "Hackathon mode",
    enum: HACKATHON_MODE_VALUES,
    example: "HYBRID",
  })
  @IsString()
  @IsIn(HACKATHON_MODE_VALUES)
  mode: HackathonModeValue;

  // Configuration
  @ApiPropertyOptional({
    description: "Hackathon visibility",
    enum: VISIBILITY_VALUES,
    default: "PUBLIC",
  })
  @IsOptional()
  @IsString()
  @IsIn(VISIBILITY_VALUES)
  visibility?: VisibilityValue;

  @ApiPropertyOptional({
    description: "Type of hackathon",
    enum: HACKATHON_TYPE_VALUES,
  })
  @IsOptional()
  @IsString()
  @IsIn(HACKATHON_TYPE_VALUES)
  hackathonType?: HackathonTypeValue;

  @ApiPropertyOptional({
    description: "Participant type/team size",
    enum: PARTICIPANT_TYPE_VALUES,
  })
  @IsOptional()
  @IsString()
  @IsIn(PARTICIPANT_TYPE_VALUES)
  participantType?: ParticipantTypeValue;

  // Location
  @ApiPropertyOptional({
    description: "Location details",
    type: () => HackathonLocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonLocationDto)
  location?: HackathonLocationDto;

  // Registration
  @ApiPropertyOptional({
    description: "Registration deadline (ISO 8601)",
    format: "date-time",
    example: "2025-03-10T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @ApiPropertyOptional({
    description: "External registration form link",
    format: "uri",
    example: "https://forms.google.com/tech-hackathon-2025",
  })
  @IsOptional()
  @IsUrl()
  externalRegistrationLink?: string;

  @ApiPropertyOptional({
    description: "Custom registration form configuration",
    type: () => RegistrationFormDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationFormDto)
  registrationForm?: RegistrationFormDto;

  // Pricing & Prizes
  @ApiPropertyOptional({
    description: "Whether the hackathon is free to enter",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  /** Decimal string e.g. "199.00" */
  @ApiPropertyOptional({
    description: "Entry fee amount (decimal string)",
    example: "199.00",
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  entryFeeAmount?: string;

  @ApiPropertyOptional({
    description: "Currency code",
    maxLength: 8,
    example: "USD",
  })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  /** Decimal string e.g. "10000.00" */
  @ApiPropertyOptional({
    description: "Total prize pool worth (decimal string)",
    example: "10000.00",
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  prizeTotalWorthAmount?: string;

  @ApiPropertyOptional({
    description: "Prize breakdown by position",
    type: [PrizeBreakdownDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => PrizeBreakdownDto)
  prizeBreakdown?: PrizeBreakdownDto[];

  /**
   * Rich text description for prizes (JSON format from editor like TipTap/Slate).
   * Stored as JSON in database.
   */
  @ApiPropertyOptional({
    description:
      "Rich text description for prizes (JSON format from editor like TipTap/Slate)",
    example: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Exciting prizes await!" }],
        },
      ],
    },
  })
  @IsOptional()
  @IsObject()
  prizeDescription?: Record<string, string | number | boolean | null | object>;

  /** Whether prize certificates will be provided */
  @ApiPropertyOptional({
    description: "Whether prize certificates will be provided",
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  prizeCertificate?: boolean;

  // Organizer
  @ApiPropertyOptional({
    description: "Organization name",
    maxLength: 180,
    example: "Tech Innovation Labs",
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  organizationName?: string;

  @ApiPropertyOptional({
    description: "Organization logo URL",
    format: "uri",
    example: "https://cdn.oppskills.com/orgs/tech-innovation-labs-logo.png",
  })
  @IsOptional()
  @IsUrl()
  organizationLogoUrl?: string;

  // University restriction
  @ApiPropertyOptional({
    description:
      "List of allowed universities (for UNIVERSITY_ONLY visibility)",
    type: [String],
    example: ["MIT", "Stanford University", "UC Berkeley"],
  })
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
    description: "Who can attend this hackathon",
    enum: HACKATHON_ATTENDEE_ELIGIBILITY_VALUES,
    isArray: true,
    default: ["EVERYONE_CAN_APPLY"],
  })
  @IsOptional()
  @IsArray()
  @IsIn(HACKATHON_ATTENDEE_ELIGIBILITY_VALUES, { each: true })
  attendeeEligibility?: HackathonAttendeeEligibilityValue[];

  /** Maximum number of teams allowed (null = unlimited) */
  @ApiPropertyOptional({
    description: "Maximum number of teams allowed (null = unlimited)",
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeams?: number;

  /**
   * DTO for replacing all rounds of a hackathon.
   */
  @ApiPropertyOptional({
    description: "Hackathon rounds (defaults to 3 rounds if not provided)",
    type: [RoundDto],
    example: [
      {
        name: "Round 1: Ideation",
        description: "Submit your initial idea and project plan",
        startsAt: "2025-03-15T10:00:00Z",
        endsAt: "2025-03-15T18:00:00Z",
        order: 0,
        roundType: "ONLINE",
      },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  rounds?: RoundDto[];

  // Additional Info
  /**
   * Additional info including contact person and attachments.
   */
  @ApiPropertyOptional({
    description: "Additional info including contact person and attachments",
    type: () => HackathonAdditionalInfoDto,
  })
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
  @IsIn(["PER_TEAM", "PER_USER"] as const)
  chargeMode?: "PER_TEAM" | "PER_USER";

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

  /**
   * College IDs whose students get free entry (max 5).
   * Only applies when isFree = false (paid hackathon).
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  freeCollegeIds?: string[];

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
  @ApiProperty({
    description: "Complete list of rounds to replace existing rounds",
    type: [RoundDto],
    example: [
      {
        name: "Round 1: Ideation",
        description: "Submit your initial idea",
        startsAt: "2025-03-15T10:00:00Z",
        endsAt: "2025-03-15T18:00:00Z",
        order: 0,
        roundType: "ONLINE",
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RoundDto)
  rounds: RoundDto[];
}

export class SubmissionFileDto {
  @ApiPropertyOptional({ description: "Media ID if using media service" })
  @IsOptional()
  @IsString()
  mediaId?: string;

  @ApiProperty({ description: "Public URL of the uploaded file" })
  @IsString()
  url: string;

  @ApiProperty({ description: "Original file name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "MIME type of the file" })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: "File size in bytes" })
  @IsNumber()
  size: number;
}

export class UpsertRoundSubmissionDto {
  @ApiProperty({
    description: "Files uploaded for this submission (max 3, 50MB each)",
    type: [SubmissionFileDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubmissionFileDto)
  @ArrayMaxSize(3)
  files: SubmissionFileDto[];

  @ApiPropertyOptional({ description: "Optional note or description" })
  @IsOptional()
  @IsString()
  note?: string;
}

/**
 * DTO for updating additional info (contact + attachments) of a hackathon.
 */
export class UpdateHackathonAdditionalInfoDto {
  @ApiPropertyOptional({
    description: "Contact person information",
    type: () => HackathonContactDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => HackathonContactDto)
  contact?: HackathonContactDto;

  @ApiPropertyOptional({
    description: "List of attachments",
    type: [HackathonAttachmentDto],
  })
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
    description: "New lifecycle status",
    enum: LIFECYCLE_STATUS_VALUES,
    example: "PUBLISHED",
  })
  @IsString()
  @IsIn(LIFECYCLE_STATUS_VALUES)
  status: HackathonLifecycleStatusValue;
}
