import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export enum ReferralEntityTypeDto {
  HACKATHON = "HACKATHON",
  EVENT = "EVENT",
  FESTIVAL = "FESTIVAL",
  COMMUNITY = "COMMUNITY",
}

export class CreateReferralDto {
  @ApiProperty({ enum: ReferralEntityTypeDto })
  @IsEnum(ReferralEntityTypeDto)
  entityType: ReferralEntityTypeDto;

  @ApiProperty({ description: "Entity id for hackathon/event/festival" })
  @IsString()
  entityId: string;

  @ApiProperty({
    description: "Exact email of existing user to assign as referrer",
  })
  @IsEmail()
  referrerEmail: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class ListReferralsQueryDto {
  @ApiProperty({ enum: ReferralEntityTypeDto })
  @IsEnum(ReferralEntityTypeDto)
  entityType: ReferralEntityTypeDto;

  @ApiProperty({ description: "Entity id for hackathon/event/festival" })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}

export class LookupUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ enum: ReferralEntityTypeDto })
  @IsEnum(ReferralEntityTypeDto)
  entityType: ReferralEntityTypeDto;

  @ApiProperty()
  @IsString()
  entityId: string;
}

export class ReferralAnalyticsDto {
  @ApiProperty()
  totalClicks: number;

  @ApiProperty()
  humanClicks: number;

  @ApiProperty()
  referredParticipants: number;

  @ApiProperty()
  totalRegistrations: number;

  @ApiProperty()
  activeReferrers: number;

  @ApiProperty()
  totalReferrers: number;

  @ApiProperty()
  linksGenerated: number;
}

export class ReferredRegistrationDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  avatarUrl?: string | null;

  @ApiProperty()
  registrationDate: string;

  @ApiProperty()
  status: "Registered" | "Participated" | "Waitlisted";
}

export class ResolveReferralDto {
  @ApiProperty({ enum: ReferralEntityTypeDto })
  entityType: ReferralEntityTypeDto;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  isActive: boolean;
}

export class TrackReferralClickDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: "source must be a valid URL" })
  source?: string;
}
