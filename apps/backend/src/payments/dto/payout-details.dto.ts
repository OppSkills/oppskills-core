import {
  IsString,
  IsOptional,
  IsNotEmpty,
  Length,
  Matches,
} from 'class-validator';

export class UpsertPayoutDetailsDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{9,18}$/, { message: 'Account number must be 9-18 digits' })
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Invalid IFSC code format' })
  ifsc: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/, {
    message: 'Invalid UPI ID format',
  })
  upiId?: string;
}
