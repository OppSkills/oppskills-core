import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CommunityIndustryValue } from '@oppskills/types';

export class PublicCommunityProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  handle: string;

  @ApiPropertyOptional()
  description: string | null;

  @ApiPropertyOptional()
  website: string | null;

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
  repostCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({
    enum: ['OWNER', 'ADMIN', 'MODERATOR', 'READ_ONLY'],
    nullable: true,
  })
  myRole: 'OWNER' | 'ADMIN' | 'MODERATOR' | 'READ_ONLY' | null;
}
