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
}
