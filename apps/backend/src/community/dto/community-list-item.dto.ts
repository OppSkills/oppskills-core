import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CommunityIndustryValue } from '@oppskills/types';

export type CommunityMyRoleValue = 'OWNER' | 'ADMIN' | 'EDITOR';

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

  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'EDITOR'] })
  myRole: CommunityMyRoleValue;

  @ApiProperty()
  createdAt: Date;
}
