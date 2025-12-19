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
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

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
  @ApiProperty({ 
    description: 'Location type for the festival', 
    enum: LOCATION_TYPE_VALUES,
    example: 'PHYSICAL'
  })
  @IsString()
  @IsIn(LOCATION_TYPE_VALUES)
  type: FestivalLocationTypeValue;

  @ApiPropertyOptional({ 
    description: 'Physical address of the festival venue (required when type=PHYSICAL)', 
    maxLength: 500,
    example: '123 Convention Center Dr, San Francisco, CA 94103'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ 
    description: 'City name for filtering and display', 
    maxLength: 120,
    example: 'San Francisco'
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @ApiPropertyOptional({ 
    description: 'Virtual meeting link (required when type=VIRTUAL)', 
    format: 'uri',
    example: 'https://zoom.us/j/123456789'
  })
  @IsOptional()
  @IsUrl()
  virtualLink?: string;
}

export class CreateFestivalDto {
  @ApiPropertyOptional({ 
    description: 'URL-friendly slug for the festival', 
    maxLength: 180,
    example: 'tech-fest-2025'
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiProperty({ 
    description: 'Festival name', 
    maxLength: 255,
    example: 'TechFest 2025 - Innovation Conference'
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ 
    description: 'Detailed festival description', 
    maxLength: 50000,
    example: 'Join us for the largest tech innovation conference of 2025, featuring hackathons, workshops, and networking opportunities.'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'URL of the festival poster/banner image', 
    format: 'uri',
    example: 'https://cdn.oppskills.com/festivals/techfest-2025-poster.jpg'
  })
  @IsOptional()
  @IsUrl()
  posterImageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Official website URL for the festival', 
    format: 'uri',
    example: 'https://techfest2025.com'
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Location details for the festival', 
    type: () => FestivalLocationDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FestivalLocationDto)
  location?: FestivalLocationDto;

  @ApiProperty({ 
    description: 'Festival start date (ISO 8601)', 
    format: 'date-time',
    example: '2025-06-15T09:00:00Z'
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({ 
    description: 'Festival end date (ISO 8601)', 
    format: 'date-time',
    example: '2025-06-18T18:00:00Z'
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ 
    description: 'Name of the organizing entity', 
    maxLength: 255,
    example: 'TechCorp International'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName?: string;

  @ApiPropertyOptional({ 
    description: 'URL of the organization logo', 
    format: 'uri',
    example: 'https://cdn.oppskills.com/orgs/techcorp-logo.png'
  })
  @IsOptional()
  @IsUrl()
  organizationLogoUrl?: string;
}

/**
 * Partial update payload for festivals.
 * - All fields are optional.
 * - `startDate`/`endDate` are optional specifically to support partial updates.
 */
export class UpdateFestivalDto {
  @ApiPropertyOptional({ 
    description: 'URL-friendly slug for the festival', 
    maxLength: 180,
    example: 'tech-fest-2025'
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  slug?: string;

  @ApiPropertyOptional({ 
    description: 'Festival name', 
    maxLength: 255,
    example: 'TechFest 2025 - Innovation Conference'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ 
    description: 'Detailed festival description', 
    maxLength: 50000,
    example: 'Join us for the largest tech innovation conference of 2025, featuring hackathons, workshops, and networking opportunities.'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50000)
  description?: string;

  @ApiPropertyOptional({ 
    description: 'URL of the festival poster/banner image', 
    format: 'uri',
    example: 'https://cdn.oppskills.com/festivals/techfest-2025-poster.jpg'
  })
  @IsOptional()
  @IsUrl()
  posterImageUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Official website URL for the festival', 
    format: 'uri',
    example: 'https://techfest2025.com'
  })
  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Location details for the festival', 
    type: () => FestivalLocationDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => FestivalLocationDto)
  location?: FestivalLocationDto;

  @ApiPropertyOptional({ 
    description: 'Festival start date (ISO 8601)', 
    format: 'date-time',
    example: '2025-06-15T09:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Festival end date (ISO 8601)', 
    format: 'date-time',
    example: '2025-06-18T18:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Name of the organizing entity', 
    maxLength: 255,
    example: 'TechCorp International'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName?: string;

  @ApiPropertyOptional({ 
    description: 'URL of the organization logo', 
    format: 'uri',
    example: 'https://cdn.oppskills.com/orgs/techcorp-logo.png'
  })
  @IsOptional()
  @IsUrl()
  organizationLogoUrl?: string;
}

/**
 * Update festival lifecycle status.
 * Allowed transitions are enforced on the backend.
 */
export class UpdateFestivalStatusDto {
  @ApiProperty({ 
    description: 'New lifecycle status for the festival', 
    enum: LIFECYCLE_STATUS_VALUES,
    example: 'PUBLISHED'
  })
  @IsString()
  @IsIn(LIFECYCLE_STATUS_VALUES)
  status: FestivalLifecycleStatusValue;
}
