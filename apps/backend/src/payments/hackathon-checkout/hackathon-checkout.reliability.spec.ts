import { Test, TestingModule } from '@nestjs/testing';
import { HackathonCheckoutService } from './hackathon-checkout.service';
import { RazorpayService } from '../gateway/razorpay.service';
import { PaymentsRouteService } from '../payments-route/payments-route.service';
import { DraftTeamService } from '../draft-team/draft-team.service';
import { RegistrationSubmitService } from '../registration-submit/registration-submit.service';
import { PaymentRegistrationEscrowService } from '../escrow/payment-registration-escrow.service';
import { ReferralService } from '../../referral/referral.service';
import { prisma } from '@oppskills/db';
import { HackathonChargeMode } from '@oppskills/db';

describe('HackathonCheckoutService (registration reliability)', () => {
  let service: HackathonCheckoutService;

  const razorpayService = {
    fetchOrder: jest.fn(),
    verifyCheckoutSignature: jest.fn(),
  };
  const paymentsRouteService = {};
  const draftTeamService = {
    joinDraftTeam: jest.fn().mockResolvedValue({}),
    createDraftTeam: jest.fn(),
  };
  const registrationSubmitService = {
    getRegistrationStatus: jest.fn(),
    ensureRegistrationAnswersAfterPayment: jest
      .fn()
      .mockResolvedValue(undefined),
  };
  const paymentEscrowService = {
    loadAnswersForVerify: jest.fn(),
    deleteByRazorpayOrderId: jest.fn().mockResolvedValue(undefined),
  };
  const referralService = {
    resolveForRegistration: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonCheckoutService,
        { provide: RazorpayService, useValue: razorpayService },
        { provide: PaymentsRouteService, useValue: paymentsRouteService },
        { provide: DraftTeamService, useValue: draftTeamService },
        {
          provide: RegistrationSubmitService,
          useValue: registrationSubmitService,
        },
        {
          provide: PaymentRegistrationEscrowService,
          useValue: paymentEscrowService,
        },
        { provide: ReferralService, useValue: referralService },
      ],
    }).compile();

    service = module.get(HackathonCheckoutService);
  });

  it('resolveMergedAnswersForVerify overlays partial body on DB draft', async () => {
    jest
      .spyOn(service as any, 'loadSubmissionAnswersForHackathonVerify')
      .mockResolvedValue([
        { fieldId: 'f-a', value: 'fromDb' },
        { fieldId: 'f-b', value: 'onlyDb' },
      ]);
    paymentEscrowService.loadAnswersForVerify.mockResolvedValue([]);

    const out = await (service as any).resolveMergedAnswersForVerify(
      'order_1',
      'user_1',
      'hack_1',
      [{ fieldId: 'f-a', value: 'fromBody' }],
    );

    expect(
      out.find((x: { fieldId: string }) => x.fieldId === 'f-a')?.value,
    ).toBe('fromBody');
    expect(
      out.find((x: { fieldId: string }) => x.fieldId === 'f-b')?.value,
    ).toBe('onlyDb');
  });

  it('PER_USER capture uses payment.teamId when Razorpay notes omit join context', async () => {
    registrationSubmitService.getRegistrationStatus.mockResolvedValue({
      hasTeam: false,
    });
    razorpayService.fetchOrder.mockResolvedValue({ notes: {} });

    const teamSpy = jest
      .spyOn(prisma.teamEntity, 'findFirst')
      .mockResolvedValue(null as any);
    const hackSpy = jest
      .spyOn(prisma.hackathonEntity, 'findUnique')
      .mockResolvedValue({
        id: 'hack-1',
        chargeMode: HackathonChargeMode.PER_USER,
        isDeleted: false,
      } as any);
    const paySpy = jest
      .spyOn(prisma.hackathonPaymentEntity, 'findUnique')
      .mockResolvedValue({ teamId: 'team-from-db' } as any);
    const subSpy = jest
      .spyOn(prisma.hackathonRegistrationSubmissionEntity, 'findUnique')
      .mockResolvedValue(null as any);

    await (service as any).submitRegistrationAnswersAfterPaymentIfProvided({
      paymentId: 'pay-1',
      hackathonId: 'hack-1',
      hackathonSlug: 'slug',
      userId: 'user-1',
      razorpayOrderId: 'order_1',
      answers: [{ fieldId: 'f1', value: 'a' }],
      referralId: null,
    });

    teamSpy.mockRestore();
    hackSpy.mockRestore();
    paySpy.mockRestore();
    subSpy.mockRestore();

    expect(draftTeamService.joinDraftTeam).toHaveBeenCalledWith({
      teamId: 'team-from-db',
      userId: 'user-1',
      referralId: null,
    });
    expect(
      registrationSubmitService.ensureRegistrationAnswersAfterPayment,
    ).toHaveBeenCalled();
  });
});
