import { Module } from '@nestjs/common';
import { AdminFeaturesService } from './features.service';
import { AdminFeaturesController } from './features.controller';

import { AdminAuthModule } from '../auth/auth.module';
import { AdminLogsModule } from '../admin-log/Logs.module';
import { HackathonModule } from '../../hackathon/hackathon.module';

@Module({
  imports: [AdminAuthModule, AdminLogsModule, HackathonModule],
  controllers: [AdminFeaturesController],
  providers: [AdminFeaturesService],
  exports: [AdminFeaturesService],
})
export class AdminFeaturesModule {}
