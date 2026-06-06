import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { COMMUNITY_POST_CONTENT_MAX_LENGTH } from '@oppskills/types';
import { MaxPlainTextLength } from '../../../common/validators/max-plain-text-length.validator';

export class CreateCommunityPostCommentDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  parentId?: string;
}

export class CreateCommunityPostRepostDto {
  @ApiPropertyOptional({ maxLength: COMMUNITY_POST_CONTENT_MAX_LENGTH })
  @IsOptional()
  @IsString()
  @MaxPlainTextLength(COMMUNITY_POST_CONTENT_MAX_LENGTH)
  caption?: string;
}
