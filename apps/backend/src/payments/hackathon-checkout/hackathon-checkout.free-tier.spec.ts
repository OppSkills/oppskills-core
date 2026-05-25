import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HackathonCheckoutService } from './hackathon-checkout.service';
import { RazorpayService } from '../gateway/razorpay.service';
import { PaymentsRouteService } from '../payments-route/payments-route.service';
import { DraftTeamService } from '../draft-team/draft-team.service';
import { RegistrationSubmitService } from '../registration-submit/registration-submit.service';
import { PaymentRegistrationEscrowService } from '../escrow/payment-registration-escrow.service';
import { ReferralService } from '../../referral/referral.service';

jest.mock('@oppskills/db', () => ({
  prisma: {
    hackathonEntity: {
      findUnique: jest.fn(),
    },
    ticketTierEntity: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    hackathonPaymentEntity: {
      findFirst: jest.fn(),
    },
    teamEntity: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
    teamMemberEntity: {
      findFirst: jest.fn(),
    },
    userOnboardingProfileEntity: {
      findUnique: jest.fn(),
    },
  },
  HackathonPaymentStatus: {
    CREATED: 'CREATED',
    CAPTURED: 'CAPTURED',
    AUTHORIZED: 'AUTHORIZED',
  },
  HackathonPaymentOrderStatus: {
    CREATED: 'CREATED',
  },
  HackathonPaymentScope: {
    TEAM: 'TEAM',
    USER: 'USER',
  },
  HackathonChargeMode: {
    PER_TEAM: 'PER_TEAM',
    PER_USER: 'PER_USER',
  },
}));

import { prisma } from '@oppskills/db';

describe('HackathonCheckoutService (free ticket tiers)', () => {
  let service: HackathonCheckoutService;
  const registrationSubmitService = {
    assertHackathonRegistrationWindow: jest.fn(),
    ensureRegistrationAnswersAfterPayment: jest.fn(),
    getRegistrationStatus: jest.fn(),
  };

  const openPaidHackathon = {
    id: 'hack-1',
    slug: 'paid-hack',
    name: 'Paid Hackathon',
    isFree: false,
    freeCollegeIds: [],
    entryFeeAmount: null,
    currency: 'INR',
    chargeMode: 'PER_TEAM',
    feeBearer: 'ORGANISER',
    registrationDeadline: new Date(Date.now() + 86400000),
    status: 'PUBLISHED',
    approvalStatus: 'APPROVED',
    isRegistrationPaused: false,
    ownerId: 'owner-1',
  };

  const freeTier = {
    id: 'tier-free',
    hackathonId: 'hack-1',
    isActive: true,
    isFree: true,
    price: 0,
    capacity: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    registrationSubmitService.assertHackathonRegistrationWindow.mockResolvedValue(
      openPaidHackathon,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HackathonCheckoutService,
        { provide: RazorpayService, useValue: { createOrder: jest.fn() } },
        { provide: PaymentsRouteService, useValue: {} },
        { provide: DraftTeamService, useValue: {} },
        {
          provide: RegistrationSubmitService,
          useValue: registrationSubmitService,
        },
        {
          provide: PaymentRegistrationEscrowService,
          useValue: { loadAnswersForVerify: jest.fn() },
        },
        { provide: ReferralService, useValue: {} },
      ],
    }).compile();

    service = module.get(HackathonCheckoutService);
  });

  describe('createPaymentOrder', () => {
    it('rejects free ticket tiers — register on hackathon page instead', async () => {
      (prisma.hackathonEntity.findUnique as jest.Mock).mockResolvedValue(
        openPaidHackathon,
      );
      (prisma.ticketTierEntity.count as jest.Mock).mockResolvedValue(2);
      (prisma.ticketTierEntity.findFirst as jest.Mock).mockResolvedValue(
        freeTier,
      );

      await expect(
        service.createPaymentOrder({
          hackathonSlug: 'paid-hack',
          userId: 'user-1',
          ticketTierId: 'tier-free',
          teamName: 'My Team',
        }),
      ).rejects.toThrow(
        'This is a free ticket. Complete registration on the hackathon page without checkout.',
      );
    });
  });

  describe('saveRegistrationCheckoutDraft', () => {
    it('rejects free ticket tiers for checkout draft', async () => {
      (prisma.ticketTierEntity.count as jest.Mock).mockResolvedValue(1);
      (prisma.ticketTierEntity.findFirst as jest.Mock).mockResolvedValue(
        freeTier,
      );

      await expect(
        service.saveRegistrationCheckoutDraft({
          hackathonSlug: 'paid-hack',
          userId: 'user-1',
          answers: [{ fieldId: 'f1', value: 'x' }],
          ticketTierId: 'tier-free',
          teamName: 'Team',
        }),
      ).rejects.toThrow(
        'This is a free ticket. Complete registration on the hackathon page without checkout.',
      );
    });

    it('rejects zero-price tiers even when isFree flag is false', async () => {
      (prisma.ticketTierEntity.count as jest.Mock).mockResolvedValue(1);
      (prisma.ticketTierEntity.findFirst as jest.Mock).mockResolvedValue({
        ...freeTier,
        isFree: false,
        price: 0,
      });

      await expect(
        service.saveRegistrationCheckoutDraft({
          hackathonSlug: 'paid-hack',
          userId: 'user-1',
          answers: [],
          ticketTierId: 'tier-free',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
