// apps/backend/src/modules/hackathon/hackathon.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TeamModule } from '../team/team.module';
import { HackathonService } from './hackathon.service';
import { HackathonController } from './hackathon.controller';
import { HackathonPublicController } from './hackathon-public.controller';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { EmailModule } from 'src/email/email.module';

import { HackathonManagerGuard } from './hackathon-manager.guard';

@Module({
  imports: [TeamModule, AnalyticsModule, forwardRef(() => EmailModule)],
  controllers: [HackathonPublicController, HackathonController],
  providers: [HackathonService, HackathonManagerGuard],
  exports: [HackathonService],
})
export class HackathonModule {}
