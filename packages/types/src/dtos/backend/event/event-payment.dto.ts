import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FeeBearer } from "../../../enums/index";

// =============================================================================
// DISCOUNT CODE TYPES
// =============================================================================

const DISCOUNT_CODE_TYPE_VALUES = ["PERCENT", "FIXED"] as const;
export type DiscountCodeTypeValue = (typeof DISCOUNT_CODE_TYPE_VALUES)[number];

// =============================================================================
// UPDATE EVENT PRICING DTO
// =============================================================================

/**
 * DTO for updating event pricing settings.
 * Used by event organizers to configure paid events.
 */
export class UpdateEventPricingDto {
  @ApiPropertyOptional({
    description: "Whether the event is free",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isFree?: boolean;

  @ApiPropertyOptional({
    description: "Entry fee amount (decimal string)",
    example: "199.00",
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  entryFeeAmount?: string;

  @ApiPropertyOptional({
    description: "Array of college IDs that get free entry",
    type: [String],
    example: ["clxxx123", "clxxx456"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  freeCollegeIds?: string[];

  @ApiPropertyOptional({
    description:
      "Who bears the Razorpay processing fee (2% + 18% GST = 2.36%). ORGANISER = deducted from payout (default). PARTICIPANT = added on top of entry fee at checkout.",
    enum: FeeBearer,
    example: FeeBearer.ORGANISER,
  })
  @IsOptional()
  @IsEnum(FeeBearer)
  feeBearer?: FeeBearer;
}

export { FeeBearer };

// =============================================================================
// CREATE PAYMENT ORDER DTO
// =============================================================================

class CreateEventPaymentOrderAnswerDto {
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @IsString()
  value: string;
}

class SaveCheckoutDraftAnswerDto {
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @IsString()
  value: string;
}

/**
 * Persist registration answers before Razorpay checkout (paid events).
 * User is redirected to /events/:slug/checkout after this succeeds.
 */
export class SaveEventRegistrationCheckoutDraftDto {
  @ApiProperty({
    description:
      "Registration form answers (same shape as join / payment order)",
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveCheckoutDraftAnswerDto)
  answers: SaveCheckoutDraftAnswerDto[];

  @ApiPropertyOptional({
    description: "Ticket tier when the event uses tiered pricing",
  })
  @IsOptional()
  @IsString()
  ticketTierId?: string;

  @ApiPropertyOptional({
    description:
      "Referral code (optional; stored for attribution on payment order later)",
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

/**
 * DTO for creating a payment order for event registration.
 */
export class CreateEventPaymentOrderDto {
  @ApiPropertyOptional({
    description: "Discount code to apply",
    maxLength: 50,
    example: "EARLYBIRD20",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  discountCode?: string;

  /** Escrowed server-side when creating the Razorpay order (verify/webhook fallback). */
  @ApiPropertyOptional({
    description:
      "Registration answers to escrow for payment verification / webhook",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEventPaymentOrderAnswerDto)
  answers?: CreateEventPaymentOrderAnswerDto[];

  /**
   * Referral code from the /r/<code> link (oppskills_ref cookie on web).
   * Persisted on Razorpay order notes so attribution survives mobile-redirect
   * / webhook flows. Optional; silently ignored if invalid or mismatched.
   */
  @ApiPropertyOptional({
    description: "Referral code to attribute the registration to",
    example: "Ab12Cd34Ef",
  })
  @IsOptional()
  @IsString()
  referralCode?: string;

  /**
   * The specific ticket tier the user is purchasing.
   * If omitted, the default base entry fee is charged.
   */
  @ApiPropertyOptional({
    description: "The specific ticket tier the user is purchasing",
    example: "evt-tier-12345",
  })
  @IsOptional()
  @IsString()
  ticketTierId?: string;
}

// =============================================================================
// VERIFY PAYMENT DTO
// =============================================================================

/**
 * DTO for verifying a Razorpay payment.
 */
export class VerifyEventPaymentDto {
  @ApiProperty({
    description: "Razorpay order ID",
    example: "order_ABC123xyz",
  })
  @IsString()
  razorpayOrderId: string;

  @ApiProperty({
    description: "Razorpay payment ID",
    example: "pay_ABC123xyz",
  })
  @IsString()
  razorpayPaymentId: string;

  @ApiProperty({
    description: "Razorpay signature for verification",
    example: "abc123def456...",
  })
  @IsString()
  razorpaySignature: string;

  @ApiPropertyOptional({
    description: "Registration form answers to submit after payment",
    type: "array",
    items: {
      type: "object",
      properties: {
        fieldId: { type: "string" },
        value: {
          oneOf: [
            { type: "string" },
            { type: "number" },
            { type: "array", items: { type: "string" } },
          ],
        },
      },
    },
  })
  @IsOptional()
  @IsArray()
  answers?: Array<{ fieldId: string; value: string | number | string[] }>;

  /**
   * Optional referral code fallback. Primary source is Razorpay order notes
   * (set at createPaymentOrder time) so this is here only for clients that
   * forward the cookie value at verify time (e.g. desktop handler callback).
   */
  @ApiPropertyOptional({
    description: "Referral code to attribute the registration to",
    example: "Ab12Cd34Ef",
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

// =============================================================================
// DISCOUNT CODE DTOS
// =============================================================================

/**
 * DTO for creating an event discount code.
 */
export class CreateEventDiscountCodeDto {
  @ApiProperty({
    description: "Discount code (case-insensitive)",
    maxLength: 50,
    example: "EARLYBIRD20",
  })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: "Type of discount",
    enum: DISCOUNT_CODE_TYPE_VALUES,
    example: "PERCENT",
  })
  @IsString()
  @IsIn(DISCOUNT_CODE_TYPE_VALUES)
  type: DiscountCodeTypeValue;

  @ApiProperty({
    description: "Discount value (percentage for PERCENT, amount for FIXED)",
    example: 20,
  })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({
    description: "Maximum total redemptions (null = unlimited)",
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({
    description: "Maximum redemptions per user",
    default: 1,
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxPerUser?: number;

  @ApiPropertyOptional({
    description: "Valid from date (ISO 8601)",
    format: "date-time",
    example: "2025-01-01T00:00:00Z",
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({
    description: "Valid until date (ISO 8601)",
    format: "date-time",
    example: "2025-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({
    description: "Whether the code is active",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

/**
 * DTO for updating an event discount code.
 */
export class UpdateEventDiscountCodeDto {
  @ApiPropertyOptional({
    description: "Whether the code is active",
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({
    description: "Maximum total redemptions (null = unlimited)",
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRedemptions?: number;

  @ApiPropertyOptional({
    description: "Valid until date (ISO 8601)",
    format: "date-time",
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

/**
 * Response for payment order creation (aligns with event-payment.service.ts).
 */
export interface EventPaymentOrderResponse {
  paymentId: string;
  razorpayOrderId: string | null;
  razorpayKey: string | null;
  amountPaise: number;
  currency: string;
  eventName: string;
  eventSlug: string;
  /** Original price before any discounts */
  originalAmount: number;
  /** Final amount after discount (if applicable) */
  finalAmount: number;
  /** Discount applied (if any) */
  discountAmount?: number;
  /** True when Razorpay is skipped (discount / college free paths) */
  zeroAmountPayment?: boolean;
  /** Whether user is from a free college */
  isCollegeFree?: boolean;
  /** Processing fee added when feeBearer === PARTICIPANT (in INR) */
  processingFeeAmount?: number;
  /** Who bears the processing fee */
  feeBearer?: FeeBearer;
}

/**
 * Response for payment verification.
 */
export interface EventPaymentVerifyResponse {
  success: boolean;
  paymentId: string;
  participantId: string;
}

/**
 * Earnings data for event organizer dashboard.
 */
export interface EventEarningsData {
  /** Total gross amount collected from all captured payments */
  totalGross: string;
  /** Total platform fees deducted */
  totalPlatformFees: string;
  /** Total organizer share (gross - fees) */
  totalOrganizerShare: string;
  /** Amount pending payout (eligible but not yet paid) */
  pendingPayout: string;
  /** Amount already paid out */
  paidOut: string;
  /** Number of captured payments */
  capturedPaymentsCount: number;
  /** Whether there are funds eligible for payout now */
  isEligibleNow: boolean;
  /** Date when pending funds become eligible (event end date + hold period) */
  eligibleAt: string | null;
}

/**
 * Discount code response.
 */
export interface EventDiscountCodeResponse {
  id: string;
  code: string;
  type: DiscountCodeTypeValue;
  value: number;
  active: boolean;
  maxRedemptions: number | null;
  maxPerUser: number;
  validFrom: string | null;
  validUntil: string | null;
  redemptionCount: number;
  createdAt: string;
}
