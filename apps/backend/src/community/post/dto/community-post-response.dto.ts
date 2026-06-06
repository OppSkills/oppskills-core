import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommunityPostAuthorInfoDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  firstName: string | null;

  @ApiPropertyOptional()
  lastName: string | null;

  @ApiPropertyOptional()
  imageUrl: string | null;
}

export class CommunityPostCommunityInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  handle: string;

  @ApiPropertyOptional()
  avatarImage: string | null;
}

export class CommunityPostRepostedFromSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  commentCount: number;

  @ApiProperty()
  repostCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: CommunityPostAuthorInfoDto })
  author: CommunityPostAuthorInfoDto;

  @ApiProperty({ type: CommunityPostCommunityInfoDto })
  community: CommunityPostCommunityInfoDto;
}

export class CommunityPostFeedItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  content: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  likeCount: number;

  @ApiProperty()
  commentCount: number;

  @ApiProperty()
  repostCount: number;

  @ApiProperty({ enum: ['ORIGINAL', 'REPOST', 'QUOTE_REPOST'] })
  postKind: string;

  @ApiPropertyOptional({ type: CommunityPostRepostedFromSummaryDto })
  repostedFrom?: CommunityPostRepostedFromSummaryDto;

  @ApiPropertyOptional()
  isLikedByMe?: boolean;

  @ApiPropertyOptional()
  isRepostedByMe?: boolean;

  @ApiProperty({ type: CommunityPostAuthorInfoDto })
  author: CommunityPostAuthorInfoDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: CommunityPostCommunityInfoDto })
  community: CommunityPostCommunityInfoDto;
}

export class CommunityPostDetailResponseDto extends CommunityPostFeedItemDto {}

export class CommunityPostFeedResponseDto {
  @ApiProperty({ type: [CommunityPostFeedItemDto] })
  items: CommunityPostFeedItemDto[];

  @ApiPropertyOptional()
  nextCursor: string | null;

  @ApiProperty()
  hasMore: boolean;
}

export class ToggleCommunityPostLikeResponseDto {
  @ApiProperty()
  liked: boolean;

  @ApiProperty()
  likeCount: number;
}
