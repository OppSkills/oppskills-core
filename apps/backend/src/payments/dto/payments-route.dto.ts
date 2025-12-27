import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BusinessType {
  INDIVIDUAL = 'individual',
  PARTNERSHIP = 'partnership',
  PRIVATE_LIMITED = 'private_limited',
  PUBLIC_LIMITED = 'public_limited',
  LLP = 'llp',
  NGO = 'ngo',
  TRUST = 'trust',
  SOCIETY = 'society',
  NOT_YET_REGISTERED = 'not_yet_registered',
}

class AddressDto {
  @IsString()
  street1: string;

  @IsOptional()
  @IsString()
  street2?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;
}

class ProfileDto {
  @IsString()
  category: string;

  @IsString()
  subcategory: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

class LegalInfoDto {
  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  gst?: string;
}

class StakeholderAddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;
}

class StakeholderKycDto {
  @IsString()
  pan: string;
}

class StakeholderDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StakeholderAddressDto)
  address?: StakeholderAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StakeholderKycDto)
  kyc?: StakeholderKycDto;
}

class SettlementsDto {
  @IsString()
  accountNumber: string;

  @IsString()
  ifscCode: string;

  @IsString()
  beneficiaryName: string;
}

export class OnboardRouteDto {
  @IsEmail()
  email: string;

  @IsString()
  phone: string;

  @IsString()
  legalBusinessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  contactName: string;

  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LegalInfoDto)
  legalInfo?: LegalInfoDto;

  @ValidateNested()
  @Type(() => StakeholderDto)
  stakeholder: StakeholderDto;

  @ValidateNested()
  @Type(() => SettlementsDto)
  settlements: SettlementsDto;
}

export class UpdateSettlementsDto {
  @IsString()
  accountNumber: string;

  @IsString()
  ifscCode: string;

  @IsString()
  beneficiaryName: string;
}
