import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumberString,
} from 'class-validator';

export class MarkPayoutPaidDto {
  @IsString()
  @IsNotEmpty()
  hackathonId: string;

  @IsString()
  @IsNotEmpty()
  organizerId: string;

  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
