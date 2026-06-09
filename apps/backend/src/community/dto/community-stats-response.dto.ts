import { ApiProperty } from '@nestjs/swagger';
import type { CommunityStatsResponse } from '@oppskills/types';

export class CommunityStatsResponseDto implements CommunityStatsResponse {
  @ApiProperty({ example: 12300 })
  totalMembers: number;

  @ApiProperty({ example: 450 })
  followerCount: number;

  @ApiProperty({ example: 12750 })
  rosterCount: number;

  @ApiProperty({ example: 1200 })
  newMembers30Days: number;

  @ApiProperty({ example: 0 })
  pageImpressions: number;

  @ApiProperty({ example: 0 })
  postImpressions: number;

  @ApiProperty({ example: 0 })
  postViews: number;

  @ApiProperty({ example: 12 })
  adminCount: number;

  @ApiProperty({ example: 4 })
  moderatorCount: number;
}
