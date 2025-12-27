import { Module } from '@nestjs/common';
import { RazorpayService } from './razorpay.service';
import { PaymentsRouteService } from './payments-route.service';
import { PaymentsRouteController } from './payments-route.controller';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { HackathonCheckoutService } from './hackathon-checkout.service';
import { HackathonCheckoutController } from './hackathon-checkout.controller';
import { DraftTeamService } from './draft-team.service';
import { DraftTeamController } from './draft-team.controller';
import { RegistrationSubmitService } from './registration-submit.service';
import { RegistrationSubmitController } from './registration-submit.controller';
import { RefundService } from './refund.service';
import { RefundController } from './refund.controller';
import { DiscountCodeService } from './discount-code.service';
import { DiscountCodeController } from './discount-code.controller';

@Module({
  controllers: [
    PaymentsRouteController,
    RazorpayWebhookController,
    HackathonCheckoutController,
    DraftTeamController,
    RegistrationSubmitController,
    RefundController,
    DiscountCodeController,
  ],
  providers: [
    RazorpayService,
    PaymentsRouteService,
    HackathonCheckoutService,
    DraftTeamService,
    RegistrationSubmitService,
    RefundService,
    DiscountCodeService,
  ],
  exports: [
    RazorpayService,
    PaymentsRouteService,
    HackathonCheckoutService,
    DraftTeamService,
    RegistrationSubmitService,
    RefundService,
    DiscountCodeService,
  ],
})
export class PaymentsModule {}
