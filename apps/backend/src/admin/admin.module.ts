import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAuthService } from './auth/auth.service';
import { AdminAccountsService } from './accounts/accounts.service';
import { AdminFeaturesService } from './features/features.service';
import { AdminLogsService } from './log/Logs.service';

@Module({
  controllers: [AdminController],
  providers: [AdminAuthService, AdminAccountsService, AdminFeaturesService, AdminLogsService],
  exports: [AdminAuthService] // Export if needed by guards or other modules
})
export class AdminModule { }
