import { Module, forwardRef } from '@nestjs/common';

import { AdminStatsController } from './stats.controller';
import { AdminStatsService } from './stats.service';
import { AdminAuthModule } from '../auth/auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminStatsController],
  providers: [AdminStatsService],
  exports: [AdminStatsService],
})
export class StatsModule {}
