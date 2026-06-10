import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CommunityIndustryValue } from '@oppskills/types';

export type CommunityMyRoleValue =
  | 'OWNER'
  | 'ADMIN'
  | 'MODERATOR'
  | 'READ_ONLY'
  | 'FOLLOWER';

export class CommunityListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  handle: string;

  @ApiPropertyOptional()
  avatarImage: string | null;

  @ApiProperty()
  industry: CommunityIndustryValue;

  @ApiProperty({
    enum: ['OWNER', 'ADMIN', 'MODERATOR', 'READ_ONLY', 'FOLLOWER'],
  })
  myRole: CommunityMyRoleValue;

  @ApiProperty()
  createdAt: Date;
}
