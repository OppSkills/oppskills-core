import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommunityPostCommentAuthorDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  firstName: string | null;

  @ApiPropertyOptional()
  lastName: string | null;

  @ApiPropertyOptional()
  imageUrl: string | null;
}

export class CommunityPostCommentItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  postId: string;

  @ApiPropertyOptional()
  parentId: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  replyCount: number;

  @ApiPropertyOptional()
  isLikedByMe?: boolean;

  @ApiProperty({ type: CommunityPostCommentAuthorDto })
  author: CommunityPostCommentAuthorDto;

  @ApiProperty()
  createdAt: Date;
}

export class CommunityPostCommentListResponseDto {
  @ApiProperty({ type: [CommunityPostCommentItemDto] })
  items: CommunityPostCommentItemDto[];

  @ApiPropertyOptional()
  nextCursor: string | null;

  @ApiProperty()
  hasMore: boolean;
}

export class ToggleCommunityPostCommentLikeResponseDto {
  @ApiProperty()
  liked: boolean;

  @ApiProperty()
  likeCount: number;
}

export class CreateCommunityPostRepostResponseDto {
  @ApiProperty()
  repostPostId: string;

  @ApiProperty()
  repostCount: number;
}

export class UndoCommunityPostRepostResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  repostCount: number;
}
