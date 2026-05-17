import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsNotEmpty,
  IsObject,
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
  PROPRIETORSHIP = 'proprietorship',
}

class AddressDto {
  @IsString()
  @IsNotEmpty()
  street1: string;

  @IsOptional()
  @IsString()
  street2?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

class ProfileDto {
  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsNotEmpty()
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
  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

class StakeholderKycDto {
  @IsString()
  @IsNotEmpty()
  pan: string;
}

class StakeholderPhoneDto {
  @IsString()
  @IsNotEmpty()
  primary: string;

  @IsOptional()
  @IsString()
  secondary?: string;
}

class NotesDto {
  [key: string]: string;
}

class StakeholderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StakeholderPhoneDto)
  phone?: StakeholderPhoneDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => StakeholderAddressDto)
  address?: StakeholderAddressDto;

  @ValidateNested()
  @Type(() => StakeholderKycDto)
  kyc: StakeholderKycDto;

  @IsOptional()
  @IsObject()
  notes?: Record<string, string>;
}

class SettlementsDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  ifscCode: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryName: string;
}

export class OnboardRouteDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  legalBusinessName: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @IsNotEmpty()
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
  @IsNotEmpty()
  accountNumber: string;

  @IsString()
  @IsNotEmpty()
  ifscCode: string;

  @IsString()
  @IsNotEmpty()
  beneficiaryName: string;
}
