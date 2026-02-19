import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAuthService } from './auth/auth.service';
import { AdminAccountsService } from './accounts/accounts.service';
import { AdminFeaturesService } from './features/features.service';
import { AdminLogsService } from './admin-log/Logs.service';
import { AdminLogsController } from './admin-log/Logs.controller';

import { StatsModule } from './stats/stats.module';

@Module({
  imports: [forwardRef(() => StatsModule)],
  controllers: [AdminController, AdminLogsController],
  providers: [AdminAuthService, AdminAccountsService, AdminFeaturesService, AdminLogsService],
  exports: [AdminAuthService] // Export if needed by guards or other modules
})
export class AdminModule { }
