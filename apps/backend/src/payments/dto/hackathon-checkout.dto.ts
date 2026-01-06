import { IsString, IsOptional, IsNotEmpty, IsNumber, Min, Max } from 'class-validator';

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
}
