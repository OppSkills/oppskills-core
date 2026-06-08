import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  MEET_AUDIENCE_SCOPE_VALUES,
  MEET_KIND_VALUES,
  MEET_STATUS_VALUES,
  type MeetAudienceScope,
  type MeetKind,
  type MeetStatus,
} from '@oppskills/types';

export class MeetPreviewResponseDto {
  @ApiProperty()
  inviteCode: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: MEET_KIND_VALUES })
  kind: MeetKind;

  @ApiProperty({ enum: MEET_STATUS_VALUES })
  status: MeetStatus;

  @ApiPropertyOptional({ nullable: true })
  scheduledStartAt: string | null;

  @ApiPropertyOptional({ nullable: true })
  communityName: string | null;

  @ApiProperty()
  hostName: string;

  @ApiProperty()
  hostUserId: string;

  @ApiProperty({ enum: MEET_AUDIENCE_SCOPE_VALUES })
  audienceScope: MeetAudienceScope;

  @ApiPropertyOptional({ nullable: true })
  audienceFilter: string | null;
}
