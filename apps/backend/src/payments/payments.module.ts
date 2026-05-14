import { Module, forwardRef } from '@nestjs/common';
import { EventModule } from '../event/event.module';
import { ReferralModule } from '../referral/referral.module';
import { RazorpayService } from './razorpay.service';
import { PaymentsRouteService } from './payments-route.service';
import { PaymentsRouteController } from './payments-route.controller';
import { RazorpayWebhookController } from './razorpay-webhook.controller';
import { RazorpayWebhookService } from './razorpay-webhook.service';
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
import { PayoutDetailsService } from './payout-details.service';
import { PayoutDetailsController } from './payout-details.controller';
import { AdminPayoutsService } from './admin-payouts.service';
import { AdminPayoutsController } from './admin-payouts.controller';
import { PaymentRegistrationEscrowService } from './payment-registration-escrow.service';
import { TicketTierService } from './ticket-tier.service';
import {
  EventTicketTierController,
  HackathonTicketTierController,
} from './ticket-tier.controller';

@Module({
  imports: [forwardRef(() => EventModule), forwardRef(() => ReferralModule)],
  controllers: [
    PaymentsRouteController,
    RazorpayWebhookController,
    HackathonCheckoutController,
    DraftTeamController,
    RegistrationSubmitController,
    RefundController,
    DiscountCodeController,
    PayoutDetailsController,
    AdminPayoutsController,
    EventTicketTierController,
    HackathonTicketTierController,
  ],
  providers: [
    RazorpayService,
    RazorpayWebhookService,
    PaymentsRouteService,
    HackathonCheckoutService,
    DraftTeamService,
    RegistrationSubmitService,
    RefundService,
    DiscountCodeService,
    PayoutDetailsService,
    AdminPayoutsService,
    PaymentRegistrationEscrowService,
    TicketTierService,
  ],
  exports: [
    RazorpayService,
    RazorpayWebhookService,
    PaymentsRouteService,
    HackathonCheckoutService,
    DraftTeamService,
    RegistrationSubmitService,
    RefundService,
    DiscountCodeService,
    PayoutDetailsService,
    AdminPayoutsService,
    PaymentRegistrationEscrowService,
    TicketTierService,
  ],
})
export class PaymentsModule { }
