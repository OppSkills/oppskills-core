import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CommunityIndustryValue } from '@oppskills/types';

export class PublicCommunityListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  handle: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiProperty()
  industry: CommunityIndustryValue;

  @ApiPropertyOptional()
  coverImage: string | null;

  @ApiPropertyOptional()
  avatarImage: string | null;

  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  postCount: number;

  @ApiProperty()
  createdAt: Date;
}

export class PublicCommunityListResponseDto {
  @ApiProperty({ type: [PublicCommunityListItemDto] })
  items: PublicCommunityListItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  page: number;
}
