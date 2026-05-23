import { Module, forwardRef } from '@nestjs/common';
import { UserAccountsService } from './user-accounts.service';
import { UserAccountsController } from './user-accounts.controller';
import { CommonModule } from '../common/common.module';
import { CollegesModule } from '../colleges/colleges.module';
import { LocationModule } from '../recommendation/location/location.module';

@Module({
  imports: [CommonModule, CollegesModule, LocationModule],
  controllers: [UserAccountsController],
  providers: [UserAccountsService],
  exports: [UserAccountsService],
})
export class UserAccountsModule {}
