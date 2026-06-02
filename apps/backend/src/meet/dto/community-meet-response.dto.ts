import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MEET_AUDIENCE_SCOPE_VALUES,
  MEET_KIND_VALUES,
  MEET_STATUS_VALUES,
  type MeetAudienceScope,
  type MeetKind,
  type MeetStatus,
} from '@oppskills/types';

export class CommunityMeetResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  communityId: string;

  @ApiProperty()
  inviteCode: string;

  @ApiProperty({ enum: MEET_KIND_VALUES })
  kind: MeetKind;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  scheduledStartAt: string | null;

  @ApiProperty({ enum: MEET_AUDIENCE_SCOPE_VALUES })
  audienceScope: MeetAudienceScope;

  @ApiProperty()
  hostUserId: string;

  @ApiProperty()
  hostName: string;

  @ApiProperty({ enum: MEET_STATUS_VALUES })
  status: MeetStatus;

  @ApiProperty()
  meetUrl: string;

  @ApiProperty()
  createdAt: string;
}
