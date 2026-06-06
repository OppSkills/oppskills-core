import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  COMMUNITY_POST_CONTENT_MAX_LENGTH,
  COMMUNITY_POST_IMAGES_MAX_COUNT,
} from '@oppskills/types';
import { MaxPlainTextLength } from '../../../common/validators/max-plain-text-length.validator';

export class CreateCommunityPostDto {
  @ApiProperty({
    description: 'Post content (plain-text length limit)',
    minLength: 1,
    maxLength: COMMUNITY_POST_CONTENT_MAX_LENGTH,
  })
  @IsString()
  @MinLength(1)
  @MaxPlainTextLength(COMMUNITY_POST_CONTENT_MAX_LENGTH)
  @MaxLength(65535)
  content: string;

  @ApiPropertyOptional({
    description: 'Image URLs uploaded via media presign',
    type: [String],
    maxItems: COMMUNITY_POST_IMAGES_MAX_COUNT,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(COMMUNITY_POST_IMAGES_MAX_COUNT)
  @IsUrl({}, { each: true })
  imageUrls?: string[];
}

export class UpdateCommunityPostDto {
  @ApiPropertyOptional({
    minLength: 1,
    maxLength: COMMUNITY_POST_CONTENT_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxPlainTextLength(COMMUNITY_POST_CONTENT_MAX_LENGTH)
  @MaxLength(65535)
  content?: string;

  @ApiPropertyOptional({
    type: [String],
    maxItems: COMMUNITY_POST_IMAGES_MAX_COUNT,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(COMMUNITY_POST_IMAGES_MAX_COUNT)
  @IsUrl({}, { each: true })
  imageUrls?: string[];
}
