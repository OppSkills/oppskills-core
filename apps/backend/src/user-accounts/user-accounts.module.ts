import { Module, forwardRef } from '@nestjs/common';
import { UserAccountsService } from './user-accounts.service';
import { UserAccountsController } from './user-accounts.controller';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
  ],
  controllers: [UserAccountsController],
  providers: [UserAccountsService],
  exports: [UserAccountsService],
})
export class UserAccountsModule {}
