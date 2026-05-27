import { Module } from '@nestjs/common';
import { FestivalController } from './festival.controller';
import { FestivalService } from './festival.service';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { LocationModule } from '../recommendation/location/location.module';

@Module({
  imports: [UserAccountsModule, LocationModule],
  controllers: [FestivalController],
  providers: [FestivalService],
  exports: [FestivalService],
})
export class FestivalModule {}
