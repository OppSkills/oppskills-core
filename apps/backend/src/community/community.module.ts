import { Module, forwardRef } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityPublicController } from './community-public.controller';
import { CommunityService } from './community.service';
import { EmailModule } from '../email/email.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CommunityPostModule } from './post/community-post.module';

@Module({
  imports: [
    EmailModule,
    AnalyticsModule,
    forwardRef(() => CommunityPostModule),
  ],
  controllers: [CommunityPublicController, CommunityController],
  providers: [CommunityService],
  exports: [CommunityService],
})
export class CommunityModule {}
