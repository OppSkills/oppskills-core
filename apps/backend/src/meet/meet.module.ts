import { Module } from '@nestjs/common';
import { CommunityMeetController } from './community-meet.controller';
import { MeetController } from './meet.controller';
import { MeetService } from './meet.service';

@Module({
  controllers: [CommunityMeetController, MeetController],
  providers: [MeetService],
  exports: [MeetService],
})
export class MeetModule {}
