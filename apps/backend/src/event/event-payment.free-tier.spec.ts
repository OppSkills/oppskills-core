import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException } from '@nestjs/common';
import { EventPaymentService } from './event-payment.service';
import { RazorpayService, PaymentRegistrationEscrowService } from '../payments';
import { ReferralService } from '../referral/referral.service';

jest.mock('@oppskills/db', () => ({
  prisma: {
    eventEntity: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketTierEntity: {
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    eventParticipantEntity: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventPaymentEntity: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userOnboardingProfileEntity: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((fn) =>
      fn({
        eventParticipantEntity: {
          create: jest.fn().mockResolvedValue({ id: 'participant-1' }),
          update: jest.fn(),
        },
        eventEntity: { update: jest.fn() },
        eventRegistrationSubmissionEntity: {
          create: jest.fn().mockResolvedValue({ id: 'submission-1' }),
        },
        eventRegistrationAnswerEntity: { create: jest.fn() },
        eventPaymentEntity: { update: jest.fn() },
      }),
    ),
  },
  EventPaymentStatus: {
    CREATED: 'CREATED',
    AUTHORIZED: 'AUTHORIZED',
    CAPTURED: 'CAPTURED',
  },
  EventPaymentOrderStatus: {
    CREATED: 'CREATED',
    PAID: 'PAID',
  },
}));

import { prisma } from '@oppskills/db';

describe('EventPaymentService (free ticket tiers)', () => {
  let service: EventPaymentService;

  const openPaidEvent = {
    id: 'event-1',
    slug: 'paid-event',
    name: 'Paid Event',
    isFree: false,
    freeCollegeIds: [],
    entryFeeAmount: 100,
    currency: 'INR',
    registrationDeadline: new Date(Date.now() + 86400000),
    status: 'PUBLISHED',
    approvalStatus: 'APPROVED',
    isRegistrationPaused: false,
    ownerId: 'owner-1',
    maxUsers: null,
    registrationCount: 0,
  };

  const freeTier = {
    id: 'tier-free',
    eventId: 'event-1',
    isActive: true,
    isFree: true,
    price: 0,
    capacity: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPaymentService,
        {
          provide: RazorpayService,
          useValue: {
            createOrder: jest.fn(),
            verifyCheckoutSignature: jest.fn(),
            getKeyId: jest.fn().mockReturnValue('test_key'),
          },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
        { provide: PaymentRegistrationEscrowService, useValue: {} },
        { provide: ReferralService, useValue: {} },
      ],
    }).compile();

    service = module.get(EventPaymentService);
    jest.clearAllMocks();
  });

  describe('createPaymentOrder', () => {
    it('rejects free ticket tiers — register on event page instead', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue(
        openPaidEvent,
      );
      (prisma.ticketTierEntity.count as jest.Mock).mockResolvedValue(2);
      (prisma.ticketTierEntity.findFirst as jest.Mock).mockResolvedValue(
        freeTier,
      );
      (prisma.eventParticipantEntity.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.eventPaymentEntity.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.createPaymentOrder({
          eventSlug: 'paid-event',
          userId: 'user-1',
          ticketTierId: 'tier-free',
        }),
      ).rejects.toThrow(
        'This is a free ticket. Complete registration on the event page without checkout.',
      );
    });

    it('rejects zero-price tiers even when isFree flag is false', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue(
        openPaidEvent,
      );
      (prisma.ticketTierEntity.count as jest.Mock).mockResolvedValue(1);
      (prisma.ticketTierEntity.findFirst as jest.Mock).mockResolvedValue({
        ...freeTier,
        isFree: false,
        price: 0,
      });
      (prisma.eventParticipantEntity.findUnique as jest.Mock).mockResolvedValue(
        null,
      );
      (prisma.eventPaymentEntity.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.createPaymentOrder({
          eventSlug: 'paid-event',
          userId: 'user-1',
          ticketTierId: 'tier-free',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('saveRegistrationCheckoutDraft', () => {
    it('rejects free ticket tiers for checkout draft', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue(
        openPaidEvent,
      );
      (prisma.ticketTierEntity.count as jest.Mock).mockResolvedValue(1);
      (prisma.ticketTierEntity.findFirst as jest.Mock).mockResolvedValue(
        freeTier,
      );
      (prisma.eventParticipantEntity.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.saveRegistrationCheckoutDraft({
          eventSlug: 'paid-event',
          userId: 'user-1',
          answers: [{ fieldId: 'f1', value: 'answer' }],
          ticketTierId: 'tier-free',
        }),
      ).rejects.toThrow(
        'This is a free ticket. Complete registration on the event page without checkout.',
      );
    });
  });
});
