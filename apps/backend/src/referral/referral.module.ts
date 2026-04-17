import { Module } from '@nestjs/common';
import { ClerkAuthConfigService } from 'src/common/config.service';
import { EmailModule } from 'src/email/email.module';
import { RedisProvider } from 'src/redis.provider';
import { ReferralAuthzService } from './referral-authz.service';
import { ReferralController } from './referral.controller';
import { ReferralCounterService } from './referral-counter.service';
import { ReferralPublicController } from './referral-public.controller';
import { ReferralService } from './referral.service';

@Module({
  imports: [EmailModule],
  controllers: [ReferralController, ReferralPublicController],
  providers: [
    ReferralService,
    ReferralAuthzService,
    ReferralCounterService,
    ClerkAuthConfigService,
    RedisProvider,
  ],
  exports: [ReferralService],
})
export class ReferralModule {}
