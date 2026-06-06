import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  COMMUNITY_INDUSTRY_VALUES,
  type CommunityIndustryValue,
  COMMUNITY_DESCRIPTION_MAX_LENGTH,
  COMMUNITY_HANDLE_MAX_LENGTH,
  COMMUNITY_HANDLE_MIN_LENGTH,
  COMMUNITY_NAME_MAX_LENGTH,
} from '@oppskills/types';

export class CreateCommunityDto {
  @ApiProperty({
    description: 'Display name of the community',
    minLength: 3,
    maxLength: COMMUNITY_NAME_MAX_LENGTH,
    example: 'OppSkills Developers',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(COMMUNITY_NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({
    description: 'Unique handle (slug) for the community URL',
    minLength: COMMUNITY_HANDLE_MIN_LENGTH,
    maxLength: COMMUNITY_HANDLE_MAX_LENGTH,
    example: 'oppskills-devs',
  })
  @IsString()
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'handle must contain only lowercase letters, numbers, underscores, and hyphens',
  })
  @MinLength(COMMUNITY_HANDLE_MIN_LENGTH)
  @MaxLength(COMMUNITY_HANDLE_MAX_LENGTH)
  handle: string;

  @ApiPropertyOptional({
    description: 'Short description of the community',
    maxLength: COMMUNITY_DESCRIPTION_MAX_LENGTH,
    example: 'A community for builders and learners.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(COMMUNITY_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiPropertyOptional({
    description: 'External website URL',
    example: 'https://example.com',
  })
  @IsOptional()
  @ValidateIf(
    (dto: CreateCommunityDto) =>
      typeof dto.website === 'string' && dto.website.trim().length > 0,
  )
  @IsUrl()
  website?: string;

  @ApiProperty({
    description: 'Industry category',
    enum: COMMUNITY_INDUSTRY_VALUES,
    example: 'TECHNOLOGY',
  })
  @IsIn(COMMUNITY_INDUSTRY_VALUES)
  industry: CommunityIndustryValue;

  @ApiPropertyOptional({
    description: 'Cover image public URL (uploaded via media presign)',
    example: 'https://cdn.oppskills.com/public/community-covers/user/abc.jpg',
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Avatar image public URL (uploaded via media presign)',
    example: 'https://cdn.oppskills.com/public/community-avatars/user/abc.jpg',
  })
  @IsOptional()
  @IsString()
  avatarImage?: string;
}
