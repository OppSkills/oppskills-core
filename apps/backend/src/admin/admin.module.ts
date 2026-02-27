import { Module, forwardRef } from '@nestjs/common';
import { AdminAuthModule } from './auth/auth.module';
import { AdminAccountsModule } from './accounts/accounts.module';
import { AdminFeaturesModule } from './features/features.module';
import { AdminLogsModule } from './admin-log/Logs.module';
import { StatsModule } from './stats/stats.module';
import { UserAccountModule } from './user-account/user-account.module';

@Module({
  imports: [
    forwardRef(() => StatsModule),
    AdminAuthModule,
    AdminAccountsModule,
    AdminFeaturesModule,
    AdminLogsModule,
    UserAccountModule
  ],
  controllers: [],
  providers: [],
  exports: [AdminAuthModule]
})
export class AdminModule { }
