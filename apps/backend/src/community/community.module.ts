import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityPublicController } from './community-public.controller';
import { CommunityService } from './community.service';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [CommunityPublicController, CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
