// apps/backend/src/modules/hackathon/hackathon.module.ts
import { Module } from '@nestjs/common';
import { TeamModule } from '../team/team.module';
import { HackathonService } from './hackathon.service';
import { HackathonController } from './hackathon.controller';
import { HackathonPublicController } from './hackathon-public.controller';
import { AnalyticsModule } from 'src/analytics/analytics.module';

@Module({
  imports: [TeamModule, AnalyticsModule],
  controllers: [HackathonPublicController, HackathonController],
  providers: [HackathonService],
  exports: [HackathonService],
})
export class HackathonModule {}
