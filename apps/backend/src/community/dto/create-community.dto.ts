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
} from '@oppskills/types';

export class CreateCommunityDto {
  @ApiProperty({
    description: 'Display name of the community',
    minLength: 3,
    maxLength: 60,
    example: 'OppSkills Developers',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  name: string;

  @ApiProperty({
    description: 'Unique handle (slug) for the community URL',
    minLength: 3,
    maxLength: 30,
    example: 'oppskills-devs',
  })
  @IsString()
  @Matches(/^[a-z0-9_-]+$/, {
    message:
      'handle must contain only lowercase letters, numbers, underscores, and hyphens',
  })
  @MinLength(3)
  @MaxLength(30)
  handle: string;

  @ApiPropertyOptional({
    description: 'Short description of the community',
    maxLength: 500,
    example: 'A community for builders and learners.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
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
