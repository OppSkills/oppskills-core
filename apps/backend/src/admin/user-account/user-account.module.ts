import { Module } from '@nestjs/common';
import { UserAccountService } from './user-account.service';
import { UserAccountController } from './user-account.controller';
import { AdminLogsModule } from '../admin-log/Logs.module';
import { AdminAuthModule } from '../auth/auth.module';

@Module({
  imports: [AdminLogsModule, AdminAuthModule],
  controllers: [UserAccountController],
  providers: [UserAccountService],
  exports: [UserAccountService]
})
export class UserAccountModule { }
