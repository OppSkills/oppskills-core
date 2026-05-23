// apps/backend/src/modules/hackathon/hackathon.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TeamModule } from '../team/team.module';
import { HackathonService } from './hackathon.service';
import { HackathonController } from './hackathon.controller';
import { HackathonPublicController } from './hackathon-public.controller';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { EmailModule } from 'src/email/email.module';
import { LocationModule } from 'src/recommendation/location/location.module';

@Module({
  imports: [
    TeamModule,
    AnalyticsModule,
    forwardRef(() => EmailModule),
    LocationModule,
  ],
  controllers: [HackathonPublicController, HackathonController],
  providers: [HackathonService],
  exports: [HackathonService],
})
export class HackathonModule {}
