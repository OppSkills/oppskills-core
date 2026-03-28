import { Module } from '@nestjs/common';
import { AdminFeaturesService } from './features.service';
import { AdminFeaturesController } from './features.controller';

import { AdminAuthModule } from '../auth/auth.module';
import { AdminLogsModule } from '../admin-log/Logs.module';

@Module({
  imports: [AdminAuthModule, AdminLogsModule],
  controllers: [AdminFeaturesController],
  providers: [AdminFeaturesService],
  exports: [AdminFeaturesService],
})
export class AdminFeaturesModule {}
