import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateRefundDto {
  @IsString()
  paymentId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
