import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  MEET_AUDIENCE_SCOPE_VALUES,
  MEET_KIND_VALUES,
  type MeetAudienceScope,
  type MeetKind,
} from '@oppskills/types';

export class CreateCommunityMeetDto {
  @ApiProperty({ enum: MEET_KIND_VALUES, example: 'INSTANT' })
  @IsIn(MEET_KIND_VALUES)
  kind: MeetKind;

  @ApiProperty({ minLength: 1, maxLength: 120, example: 'Weekly sync' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'ISO8601 datetime for scheduled meets',
    example: '2026-05-31T14:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  scheduledStartAt?: string;

  @ApiPropertyOptional({ enum: MEET_AUDIENCE_SCOPE_VALUES, default: 'ALL' })
  @IsOptional()
  @IsIn(MEET_AUDIENCE_SCOPE_VALUES)
  audienceScope?: MeetAudienceScope;
}
