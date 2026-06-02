import { ApiProperty } from '@nestjs/swagger';

export class MeetJoinTokenResponseDto {
  @ApiProperty()
  token: string;

  @ApiProperty()
  livekitUrl: string;

  @ApiProperty()
  roomName: string;

  @ApiProperty()
  participantName: string;

  @ApiProperty()
  participantIdentity: string;
}
