import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityPublicController } from './community-public.controller';
import { CommunityService } from './community.service';
import { EmailModule } from '../email/email.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [EmailModule, AnalyticsModule],
  controllers: [CommunityPublicController, CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
