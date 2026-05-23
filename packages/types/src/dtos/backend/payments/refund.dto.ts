import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
} from "class-validator";

export class CreateRefundDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
