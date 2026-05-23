import { Module, forwardRef } from '@nestjs/common';
import { EventModule } from '../event/event.module';
import { ReferralModule } from '../referral/referral.module';
import { RazorpayService } from './gateway/razorpay.service';
import { PaymentsRouteService } from './payments-route/payments-route.service';
import { PaymentsRouteController } from './payments-route/payments-route.controller';
import { RazorpayWebhookController } from './webhook/razorpay-webhook.controller';
import { RazorpayWebhookService } from './webhook/razorpay-webhook.service';
import { HackathonCheckoutService } from './hackathon-checkout/hackathon-checkout.service';
import { HackathonCheckoutController } from './hackathon-checkout/hackathon-checkout.controller';
import { DraftTeamService } from './draft-team/draft-team.service';
import { DraftTeamController } from './draft-team/draft-team.controller';
import { RegistrationSubmitService } from './registration-submit/registration-submit.service';
import { RegistrationSubmitController } from './registration-submit/registration-submit.controller';
import { RefundService } from './refund/refund.service';
import { RefundController } from './refund/refund.controller';
import { DiscountCodeService } from './discount-code/discount-code.service';
import { DiscountCodeController } from './discount-code/discount-code.controller';
import { PayoutDetailsService } from './payout-details/payout-details.service';
import { PayoutDetailsController } from './payout-details/payout-details.controller';
import { AdminPayoutsService } from './admin-payouts/admin-payouts.service';
import { AdminPayoutsController } from './admin-payouts/admin-payouts.controller';
import { PaymentRegistrationEscrowService } from './escrow/payment-registration-escrow.service';
import { TicketTierService } from './ticket-tier/ticket-tier.service';
import {
  EventTicketTierController,
  HackathonTicketTierController,
} from './ticket-tier/ticket-tier.controller';

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
export class PaymentsModule {}
