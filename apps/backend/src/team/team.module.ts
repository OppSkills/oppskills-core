import { Module, forwardRef } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { ReferralModule } from 'src/referral/referral.module';

@Module({
  imports: [forwardRef(() => ReferralModule)],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
