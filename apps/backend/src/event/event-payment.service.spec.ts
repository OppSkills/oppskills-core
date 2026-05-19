import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventPaymentService } from './event-payment.service';
import {
  RazorpayService,
  PaymentRegistrationEscrowService,
} from '../payments';
import { ReferralService } from '../referral/referral.service';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

// Mock prisma
jest.mock('@oppskills/db', () => ({
  prisma: {
    eventEntity: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    ticketTierEntity: {
      count: jest.fn().mockResolvedValue(0),
    },
    eventParticipantEntity: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    eventPaymentEntity: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    eventDiscountCodeEntity: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    eventDiscountRedemptionEntity: {
      count: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    eventPayoutEntity: {
      findMany: jest.fn(),
    },
    userOnboardingProfileEntity: {
      findUnique: jest.fn(),
    },
    userEntity: {
      findUnique: jest.fn(),
    },
    eventUserRoleEntity: {
      findFirst: jest.fn(),
    },
    $transaction: jest.fn((fn) =>
      fn({
        eventParticipantEntity: {
          create: jest.fn().mockResolvedValue({ id: 'participant-1' }),
        },
        eventEntity: {
          update: jest.fn(),
        },
        eventRegistrationSubmissionEntity: {
          create: jest.fn().mockResolvedValue({ id: 'submission-1' }),
        },
        eventRegistrationAnswerEntity: {
          create: jest.fn(),
        },
        eventPaymentEntity: {
          update: jest.fn(),
        },
        eventDiscountRedemptionEntity: {
          create: jest.fn(),
        },
      }),
    ),
  },
  EventPaymentStatus: {
    CREATED: 'CREATED',
    AUTHORIZED: 'AUTHORIZED',
    CAPTURED: 'CAPTURED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  },
  EventPaymentOrderStatus: {
    CREATED: 'CREATED',
    PAID: 'PAID',
    FAILED: 'FAILED',
  },
}));

import { prisma } from '@oppskills/db';

describe('EventPaymentService', () => {
  let service: EventPaymentService;
  let razorpayService: RazorpayService;

  const mockRazorpayService = {
    createOrder: jest.fn(),
    verifyCheckoutSignature: jest.fn(),
    getKeyId: jest.fn().mockReturnValue('test_key_id'),
  };

  const mockEventEmitter = { emit: jest.fn() };
  const mockEscrow = {};
  const mockReferral = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventPaymentService,
        {
          provide: RazorpayService,
          useValue: mockRazorpayService,
        },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        {
          provide: PaymentRegistrationEscrowService,
          useValue: mockEscrow,
        },
        { provide: ReferralService, useValue: mockReferral },
      ],
    }).compile();

    service = module.get<EventPaymentService>(EventPaymentService);
    razorpayService = module.get<RazorpayService>(RazorpayService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPaymentOrder', () => {
    const mockEvent = {
      id: 'event-1',
      slug: 'test-event',
      name: 'Test Event',
      isFree: false,
      freeCollegeIds: [],
      entryFeeAmount: 100,
      currency: 'INR',
      registrationDeadline: new Date(Date.now() + 86400000), // Tomorrow
      status: 'PUBLISHED',
      approvalStatus: 'APPROVED',
      isRegistrationPaused: false,
      ownerId: 'owner-1',
      maxUsers: null,
      registrationCount: 0,
    };

    it('should throw BadRequestException if event is free', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvent,
        isFree: true,
      });

      await expect(
        service.createPaymentOrder({
          eventSlug: 'test-event',
          userId: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if event not found', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.createPaymentOrder({
          eventSlug: 'nonexistent-event',
          userId: 'user-1',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if registration is paused', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue({
        ...mockEvent,
        isRegistrationPaused: true,
      });

      await expect(
        service.createPaymentOrder({
          eventSlug: 'test-event',
          userId: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already registered', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (prisma.eventParticipantEntity.findUnique as jest.Mock).mockResolvedValue(
        {
          id: 'existing-participant',
          checkoutPending: false,
        },
      );

      await expect(
        service.createPaymentOrder({
          eventSlug: 'test-event',
          userId: 'user-1',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEventEarnings', () => {
    it('should throw NotFoundException if event not found', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.getEventEarnings('nonexistent-event', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not organizer', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        ownerId: 'other-user',
        name: 'Test Event',
        endDate: new Date(),
      });
      (prisma.userEntity.findUnique as jest.Mock).mockResolvedValue({
        accessLevel: 'USER',
      });
      (prisma.eventUserRoleEntity.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.getEventEarnings('test-event', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createDiscountCode', () => {
    it('should throw BadRequestException if code already exists', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        ownerId: 'user-1',
      });
      (prisma.eventDiscountCodeEntity.findFirst as jest.Mock).mockResolvedValue(
        {
          id: 'existing-code',
          code: 'TEST10',
        },
      );

      await expect(
        service.createDiscountCode('test-event', 'user-1', {
          code: 'TEST10',
          type: 'PERCENT',
          value: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user is not organizer', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        ownerId: 'other-user',
      });
      (prisma.userEntity.findUnique as jest.Mock).mockResolvedValue({
        accessLevel: 'USER',
      });
      (prisma.eventUserRoleEntity.findFirst as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.createDiscountCode('test-event', 'user-1', {
          code: 'TEST10',
          type: 'PERCENT',
          value: 10,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteDiscountCode', () => {
    it('should throw NotFoundException if discount code not found', async () => {
      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'event-1',
        ownerId: 'user-1',
      });
      (
        prisma.eventDiscountCodeEntity.findUnique as jest.Mock
      ).mockResolvedValue(null);

      await expect(
        service.deleteDiscountCode('test-event', 'nonexistent-code', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
