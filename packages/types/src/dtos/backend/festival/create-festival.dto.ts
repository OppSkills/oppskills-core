import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const LOCATION_TYPE_VALUES = ["PHYSICAL", "VIRTUAL"] as const;
export type FestivalLocationTypeValue = (typeof LOCATION_TYPE_VALUES)[number];

const LIFECYCLE_STATUS_VALUES = [
  "DRAFT",
  "PUBLISHED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
] as const;
export type FestivalLifecycleStatusValue =
  (typeof LIFECYCLE_STATUS_VALUES)[number];

export class FestivalLocationDto {
  @IsString()
  @IsIn(LOCATION_TYPE_VALUES)
  type: FestivalLocationTypeValue;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsUrl()
  virtualLink?: string;
}

export class CreateFestivalDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(50000)
  description?: string;

  @IsOptional()
  @IsUrl()
  posterImageUrl?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => FestivalLocationDto)
  location?: FestivalLocationDto;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName?: string;

  @IsOptional()
  @IsUrl()
  organizationLogoUrl?: string;
}

export class UpdateFestivalDto extends CreateFestivalDto {}

/**
 * Update festival lifecycle status.
 * Allowed transitions are enforced on the backend.
 */
export class UpdateFestivalStatusDto {
  @IsString()
  @IsIn(LIFECYCLE_STATUS_VALUES)
  status: FestivalLifecycleStatusValue;
}
