import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReferralEntityTypeDto {
  HACKATHON = 'HACKATHON',
  EVENT = 'EVENT',
  FESTIVAL = 'FESTIVAL',
}

export class GenerateReferralDto {
  @ApiProperty({ enum: ReferralEntityTypeDto })
  @IsEnum(ReferralEntityTypeDto)
  entityType: ReferralEntityTypeDto;

  @ApiProperty()
  @IsString()
  entityId: string;

  @ApiProperty()
  @IsString()
  referrerEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class TrackClickDto {
  @ApiProperty()
  @IsString()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;
}

export class ReferredRegistrationDto {
  name: string;
  email: string;
  registrationDate: string;
  status: string;
}

export class ReferralPerformanceDto {
  totalClicks: number;
  humanClicks: number;
  referredParticipants: number;
  totalRegistrations: number;
  linksGenerated: number;
}
