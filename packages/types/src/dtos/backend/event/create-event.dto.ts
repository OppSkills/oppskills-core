import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
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

const LOCATION_TYPE_VALUES = ["PHYSICAL", "VIRTUAL"] as const;
export type EventLocationTypeValue = (typeof LOCATION_TYPE_VALUES)[number];

const LIFECYCLE_STATUS_VALUES = [
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
] as const;
export type EventLifecycleStatusValue =
  (typeof LIFECYCLE_STATUS_VALUES)[number];

const VISIBILITY_VALUES = ["PUBLIC", "PRIVATE", "UNIVERSITY_ONLY"] as const;
export type EventVisibilityValue = (typeof VISIBILITY_VALUES)[number];

const EVENT_TYPE_VALUES = [
  "WORKSHOP",
  "CONFERENCE",
  "MEETUP",
  "NETWORKING",
  "SEMINAR",
  "WEBINAR",
  "OTHER",
] as const;
export type EventTypeValue = (typeof EVENT_TYPE_VALUES)[number];

/** Who can attend the event (multi-select). */
const EVENT_ATTENDEE_ELIGIBILITY_VALUES = [
  "EVERYONE_CAN_APPLY",
  "SCHOOL_STUDENTS",
  "COLLEGE_STUDENTS",
  "FRESHERS",
  "PROFESSIONALS",
] as const;
export type EventAttendeeEligibilityValue =
  (typeof EVENT_ATTENDEE_ELIGIBILITY_VALUES)[number];

const REGISTRATION_FIELD_TYPE_VALUES = [
  "TEXT",
  "PHONE_NO",
  "EMAIL",
  "NUMBER",
  "ATTACHMENTS",
  "OPTIONS",
] as const;
export type EventRegistrationFieldTypeValue =
  (typeof REGISTRATION_FIELD_TYPE_VALUES)[number];

/**
 * Location DTO for events (reuses same pattern as Hackathon).
 */
export class EventLocationDto {
  /** Location type for the event. */
  @ApiProperty({
    description: "Location type (PHYSICAL or VIRTUAL)",
    enum: LOCATION_TYPE_VALUES,
    example: "PHYSICAL",
  })
  @IsString()
  @IsIn(LOCATION_TYPE_VALUES)
  type: EventLocationTypeValue;

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

/**
 * Prize breakdown for events.
 */
export class EventPrizeBreakdownDto {
  @ApiProperty({
    description: 'Prize position (e.g., "Winner", "Runner-up")',
    maxLength: 60,
    example: "Winner",
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

  @ApiPropertyOptional({
    description: "Prize description",
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

/**
 * Contact person information for event additional info.
 */
export class EventContactDto {
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
 * Attachment for event (S3-ready).
 */
export class EventAttachmentDto {
  /** Storage key for S3 or other storage provider */
  @ApiProperty({
    description: "Storage key for S3 or other storage provider",
    maxLength: 500,
    example: "events/2025/tech-meetup/brochure.pdf",
  })
  @IsString()
  @MaxLength(500)
  storageKey: string;

  /** Optional public URL (for direct access or CDN) */
  @ApiPropertyOptional({
    description: "Optional public URL (for direct access or CDN)",
    format: "uri",
    example: "https://cdn.oppskills.com/events/2025/tech-meetup/brochure.pdf",
  })
  @IsOptional()
  @IsUrl()
  publicUrl?: string;

  /** Original file name */
  @ApiPropertyOptional({
    description: "Original file name",
    maxLength: 255,
    example: "event-brochure-2025.pdf",
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
 * Additional info for event (contact + attachments).
 */
export class EventAdditionalInfoDto {
  /** Contact person information */
  @ApiPropertyOptional({
    description: "Contact person information",
    type: () => EventContactDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventContactDto)
  contact?: EventContactDto;

  /** Attachments (S3-ready) */
  @ApiPropertyOptional({
    description: "Attachments (S3-ready)",
    type: [EventAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventAttachmentDto)
  attachments?: EventAttachmentDto[];
}

/**
 * Registration field for events.
 */
export class EventRegistrationFieldDto {
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
  type: EventRegistrationFieldTypeValue;

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
    example: "Enter your response",
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  placeholder?: string;
}

/**
 * Registration form for events.
 */
export class EventRegistrationFormDto {
  @ApiPropertyOptional({
    description: "External form link (e.g., Google Forms, Typeform)",
    format: "uri",
    example: "https://forms.google.com/event-registration",
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
    type: [EventRegistrationFieldDto],
  })
  @IsOptional()
  @ValidateIf((value: EventRegistrationFormDto) => !value.externalFormLink)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventRegistrationFieldDto)
  fields?: EventRegistrationFieldDto[];
}

/**
 * Create an event.
 * - Initial status is always DRAFT (user can later publish).
 * - Simpler than hackathon: no rounds, no teams, individual participation only.
 */
export class CreateEventDto {
  // Basic Details
  @ApiProperty({
    description: "Event name",
    maxLength: 160,
    example: "Tech Meetup 2025",
  })
  @IsString()
  @MaxLength(160)
  name: string;

  @ApiPropertyOptional({
    description: "Detailed event description",
    maxLength: 20000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20000)
  description?: string;

  @ApiPropertyOptional({
    description: "URL-friendly slug",
    maxLength: 180,
    example: "tech-meetup-2025",
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  /**
   * Optional parent festival. If not provided, event is standalone.
   * (NULL in DB means "Individual Event")
   */
  @ApiPropertyOptional({
    description: "Parent festival ID (null for standalone event)",
    format: "uuid",
    example: "550e8400-e29b-41d4-a716-446655440002",
  })
  @IsOptional()
  @IsString()
  festivalId?: string;

  @ApiPropertyOptional({
    description: "Banner image URL",
    format: "uri",
    example: "https://cdn.oppskills.com/events/tech-meetup-2025-banner.jpg",
  })
  @IsOptional()
  @IsUrl()
  bannerImageUrl?: string;

  // Core dates
  @ApiProperty({
    description: "Event start date (ISO 8601)",
    format: "date-time",
    example: "2025-03-15T10:00:00Z",
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: "Event end date (ISO 8601)",
    format: "date-time",
    example: "2025-03-15T18:00:00Z",
  })
  @IsDateString()
  endDate: string;

  // Configuration
  @ApiPropertyOptional({
    description: "Event visibility",
    enum: VISIBILITY_VALUES,
    default: "PUBLIC",
  })
  @IsOptional()
  @IsString()
  @IsIn(VISIBILITY_VALUES)
  visibility?: EventVisibilityValue;

  @ApiPropertyOptional({
    description: "Type of event",
    enum: EVENT_TYPE_VALUES,
    example: "CONFERENCE",
  })
  @IsOptional()
  @IsString()
  @IsIn(EVENT_TYPE_VALUES)
  eventType?: EventTypeValue;

  // Location
  @ApiPropertyOptional({
    description: "Location details",
    type: () => EventLocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventLocationDto)
  location?: EventLocationDto;

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
    example: "https://forms.google.com/tech-event-2025",
  })
  @IsOptional()
  @IsUrl()
  externalRegistrationLink?: string;

  @ApiPropertyOptional({
    description: "Custom registration form configuration",
    type: () => EventRegistrationFormDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventRegistrationFormDto)
  registrationForm?: EventRegistrationFormDto;

  // Eligibility
  @ApiPropertyOptional({
    description: "Who can attend this event",
    enum: EVENT_ATTENDEE_ELIGIBILITY_VALUES,
    isArray: true,
    default: ["EVERYONE_CAN_APPLY"],
  })
  @IsOptional()
  @IsArray()
  @IsIn(EVENT_ATTENDEE_ELIGIBILITY_VALUES, { each: true })
  attendeeEligibility?: EventAttendeeEligibilityValue[];

  // Capacity
  @ApiPropertyOptional({
    description: "Maximum number of users allowed (null = unlimited)",
    minimum: 1,
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  // Pricing (metadata only)
  @ApiPropertyOptional({
    description: "Whether the event is free to attend",
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

  // Prizes
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
    type: [EventPrizeBreakdownDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => EventPrizeBreakdownDto)
  prizeBreakdown?: EventPrizeBreakdownDto[];

  /**
   * Rich text description for prizes (JSON format from editor like TipTap/Slate).
   */
  @ApiPropertyOptional({
    description:
      "Rich text description for prizes (JSON format from editor like TipTap/Slate)",
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

  // Additional Info
  @ApiPropertyOptional({
    description: "Additional info including contact person and attachments",
    type: () => EventAdditionalInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventAdditionalInfoDto)
  additionalInfo?: EventAdditionalInfoDto;
}

// =====================
// Event Pass Settings Types (defined before UpdateEventDto for use in decorators)
// =====================

const PASS_SENDING_MODE_VALUES = ["IMMEDIATE", "APPROVAL"] as const;
export type PassSendingModeValue = (typeof PASS_SENDING_MODE_VALUES)[number];

const COLLEGE_MATCH_MODE_VALUES = [
  "PROFILE_ONLY",
  "EMAIL_ONLY",
  "EITHER_OR",
  "BOTH_REQUIRED",
] as const;
export type CollegeMatchModeValue = (typeof COLLEGE_MATCH_MODE_VALUES)[number];

/**
 * Partial update payload for events.
 * All fields are optional to support partial updates.
 */
export class UpdateEventDto {
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
  @IsIn(VISIBILITY_VALUES)
  visibility?: EventVisibilityValue;

  @IsOptional()
  @IsString()
  @IsIn(EVENT_TYPE_VALUES)
  eventType?: EventTypeValue;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventLocationDto)
  location?: EventLocationDto;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsUrl()
  externalRegistrationLink?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventRegistrationFormDto)
  registrationForm?: EventRegistrationFormDto;

  @IsOptional()
  @IsArray()
  @IsIn(EVENT_ATTENDEE_ELIGIBILITY_VALUES, { each: true })
  attendeeEligibility?: EventAttendeeEligibilityValue[];

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number | null;

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
  @Type(() => EventPrizeBreakdownDto)
  prizeBreakdown?: EventPrizeBreakdownDto[];

  @IsOptional()
  @IsObject()
  prizeDescription?: Record<string, string | number | boolean | null | object>;

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
  @ValidateNested()
  @Type(() => EventAdditionalInfoDto)
  additionalInfo?: EventAdditionalInfoDto;

  // Event Pass Settings
  @IsOptional()
  @IsString()
  @IsIn(PASS_SENDING_MODE_VALUES)
  passSendingMode?: PassSendingModeValue;

  @IsOptional()
  @IsBoolean()
  collegeRestrictionEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCollegeIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedEmailDomains?: string[];

  @IsOptional()
  @IsString()
  @IsIn(COLLEGE_MATCH_MODE_VALUES)
  collegeMatchMode?: CollegeMatchModeValue;
}

/**
 * DTO for updating event status.
 */
export class UpdateEventStatusDto {
  @ApiProperty({
    description: "New lifecycle status",
    enum: LIFECYCLE_STATUS_VALUES,
    example: "PUBLISHED",
  })
  @IsString()
  @IsIn(LIFECYCLE_STATUS_VALUES)
  status: EventLifecycleStatusValue;
}

/**
 * DTO for updating additional info (contact + attachments) of an event.
 */
export class UpdateEventAdditionalInfoDto {
  @ApiPropertyOptional({
    description: "Contact person information",
    type: () => EventContactDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventContactDto)
  contact?: EventContactDto;

  @ApiPropertyOptional({
    description: "List of attachments",
    type: [EventAttachmentDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventAttachmentDto)
  attachments?: EventAttachmentDto[];
}

/**
 * DTO for updating the registration form of an event.
 */
export class UpdateEventRegistrationFormDto {
  @ApiProperty({
    description: "Registration form configuration",
    type: () => EventRegistrationFormDto,
  })
  @ValidateNested()
  @Type(() => EventRegistrationFormDto)
  registrationForm: EventRegistrationFormDto;
}

/**
 * DTO for updating the prize breakdown of an event.
 */
export class UpdateEventPrizeBreakdownDto {
  @ApiProperty({
    description: "Complete list of prizes",
    type: [EventPrizeBreakdownDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventPrizeBreakdownDto)
  prizeBreakdown: EventPrizeBreakdownDto[];
}

/**
 * DTO for updating max users limit.
 */
export class UpdateEventMaxUsersDto {
  @ApiProperty({
    description: "Maximum number of users allowed (null = unlimited)",
    example: 100,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers: number | null;
}

// =====================
// Approval Workflow DTOs
// =====================

const APPROVAL_STATUS_VALUES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type ApprovalStatusValue = (typeof APPROVAL_STATUS_VALUES)[number];

/**
 * DTO for submitting an entity for approval.
 */
export class SubmitForApprovalDto {
  @ApiPropertyOptional({
    description: "Optional note for the approval request",
    maxLength: 2000,
    example: "Ready for review - all content finalized.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

/**
 * DTO for admin approval/rejection of an entity.
 */
export class UpdateApprovalStatusDto {
  @ApiProperty({
    description: "New approval status",
    enum: ["APPROVED", "REJECTED"],
    example: "APPROVED",
  })
  @IsString()
  @IsIn(["APPROVED", "REJECTED"])
  approvalStatus: "APPROVED" | "REJECTED";

  @ApiPropertyOptional({
    description: "Optional note (e.g., rejection reason)",
    maxLength: 2000,
    example: "Content needs revision: please update the description.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}

/**
 * DTO for updating registration paused status.
 */
export class UpdateEventRegistrationPausedDto {
  @ApiProperty({
    description: "Whether registrations are paused",
    example: true,
  })
  @IsBoolean()
  isRegistrationPaused: boolean;
}

// =====================
// Event Registration DTOs
// =====================

/**
 * Single answer to a registration field.
 */
export class EventRegistrationAnswerDto {
  @ApiProperty({
    description: "ID of the registration field being answered",
    example: "clxx1234abcd",
  })
  @IsString()
  fieldId: string;

  @ApiProperty({
    description: "The answer value - string for TEXT/EMAIL/PHONE_NO, number for NUMBER, string[] for OPTIONS",
    oneOf: [
      { type: "string" },
      { type: "number" },
      { type: "array", items: { type: "string" } },
    ],
    example: "john@example.com",
  })
  @IsDefined()
  value: string | number | string[];
}

/**
 * DTO for joining an event with optional registration answers.
 */
export class JoinEventDto {
  @ApiPropertyOptional({
    description: "Array of answers to registration form fields (required if event has registration form)",
    type: [EventRegistrationAnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventRegistrationAnswerDto)
  answers?: EventRegistrationAnswerDto[];
}

/**
 * Event pass settings interface.
 */
export interface EventPassSettings {
  passSendingMode: PassSendingModeValue;
  collegeRestrictionEnabled: boolean;
  allowedCollegeIds: string[];
  allowedEmailDomains: string[];
  collegeMatchMode: CollegeMatchModeValue;
}

/**
 * Event participant with approval and pass status.
 */
export interface EventParticipantWithStatus {
  id: string;
  name: string;
  email: string;
  university: string;
  avatarUrl?: string;
  location?: string;
  course?: string;
  registeredOn: string;
  approved: boolean;
  passEmailSent: boolean;
  passEmailSentAt?: string;
  approvedAt?: string;
}

