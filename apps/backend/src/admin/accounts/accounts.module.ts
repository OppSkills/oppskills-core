import { Module } from '@nestjs/common';
import { AdminAccountsController } from './accounts.controller';
import { AdminAccountsService } from './accounts.service';
import { AdminLogsModule } from '../admin-log/Logs.module';
import { AdminAuthModule } from '../auth/auth.module';

@Module({
  imports: [AdminLogsModule, AdminAuthModule],
  controllers: [AdminAccountsController],
  providers: [AdminAccountsService],
  exports: [AdminAccountsService],
})
export class AdminAccountsModule {}
