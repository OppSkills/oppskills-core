import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import {
  COMMUNITY_DESCRIPTION_MAX_LENGTH,
  COMMUNITY_NAME_MAX_LENGTH,
} from '@oppskills/types';

export class UpdateCommunityDto {
  @ApiPropertyOptional({ minLength: 3, maxLength: COMMUNITY_NAME_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(COMMUNITY_NAME_MAX_LENGTH)
  name?: string;

  @ApiPropertyOptional({ maxLength: COMMUNITY_DESCRIPTION_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(COMMUNITY_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf(
    (dto: UpdateCommunityDto) =>
      typeof dto.website === 'string' && dto.website.trim().length > 0,
  )
  @IsUrl()
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarImage?: string;
}
