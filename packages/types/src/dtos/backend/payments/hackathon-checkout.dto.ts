import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class VerifyPaymentAnswerDto {
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @IsString()
  value: string;
}

class CreateOrderAnswerDto {
  @IsString()
  @IsNotEmpty()
  fieldId: string;

  @IsString()
  value: string;
}

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  teamName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxSize?: number;

  @IsOptional()
  @IsString()
  discountCode?: string;

  /** PER_USER: invitation code for join-before-pay flows (stored on Razorpay order notes). */
  @IsOptional()
  @IsString()
  invitationCode?: string;

  /** PER_USER: join this team after payment (list join flow; stored on Razorpay order notes). */
  @IsOptional()
  @IsString()
  joinTeamId?: string;

  /** Escrowed server-side when creating the Razorpay order (verify/webhook fallback). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderAnswerDto)
  answers?: CreateOrderAnswerDto[];

  /**
   * Referral code from the /r/<code> link (oppskills_ref cookie on web).
   * Persisted on Razorpay order notes so attribution survives mobile-redirect /
   * webhook flows. Optional and silently ignored if invalid.
   */
  @IsOptional()
  @IsString()
  referralCode?: string;

  /**
   * The specific ticket tier the user is purchasing.
   * If omitted, the default base entry fee is charged.
   */
  @IsOptional()
  @IsString()
  ticketTierId?: string;
}

export class SaveHackathonRegistrationCheckoutDraftDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderAnswerDto)
  answers: CreateOrderAnswerDto[];

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  teamName?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxSize?: number;

  @IsOptional()
  @IsString()
  invitationCode?: string;

  @IsOptional()
  @IsString()
  joinTeamId?: string;

  @IsOptional()
  @IsString()
  referralCode?: string;

  @IsOptional()
  @IsString()
  ticketTierId?: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  razorpayOrderId: string;

  @IsString()
  @IsNotEmpty()
  razorpayPaymentId: string;

  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;

  /** When provided, registration answers are saved in the same request as payment verification (hackathons). */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerifyPaymentAnswerDto)
  answers?: VerifyPaymentAnswerDto[];

  /**
   * Optional referral code fallback. Primary source is Razorpay order notes
   * (set at createPaymentOrder time) so this is here only for clients that
   * may forward the cookie value at verify time.
   */
  @IsOptional()
  @IsString()
  referralCode?: string;
}
