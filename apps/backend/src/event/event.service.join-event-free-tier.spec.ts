jest.mock('@oppskills/db', () => {
  const tx = {
    eventEntity: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    eventParticipantEntity: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    eventRegistrationSubmissionEntity: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    eventRegistrationAnswerEntity: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
  };

  return {
    prisma: {
      eventEntity: { findUnique: jest.fn() },
      eventParticipantEntity: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      ticketTierEntity: { findFirst: jest.fn() },
      eventPaymentEntity: { findFirst: jest.fn() },
      userOnboardingProfileEntity: {
        findUnique: jest.fn(),
        upsert: jest.fn().mockResolvedValue({}),
      },
      eventRegistrationFormEntity: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      eventRegistrationFieldEntity: {
        create: jest.fn(),
        update: jest.fn(),
      },
      userEntity: { findUnique: jest.fn() },
      eventRegistrationSubmissionEntity: { findFirst: jest.fn() },
      eventPaymentEntity: { findFirst: jest.fn() },
      $transaction: jest.fn(async (cb: (client: typeof tx) => unknown) =>
        cb(tx),
      ),
    },
  };
});

import { BadRequestException } from '@nestjs/common';
import { EventService } from './event.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AnalyticsService } from '../analytics/analytics.service';
import { ReferralService } from '../referral/referral.service';
import { LocationService } from '../recommendation/location/location.service';
import { prisma } from '@oppskills/db';

describe('EventService — free/paid ticket tiers', () => {
  let service: EventService;
  const prismaMock = prisma as any;
  const referralService = {
    resolveForRegistration: jest.fn().mockResolvedValue(null),
    markRegistrationAttributed: jest.fn(),
  };

  const publishedEvent = {
    id: 'event-1',
    name: 'Tiered Event',
    slug: 'tiered-event',
    startDate: new Date(Date.now() + 86400000),
    eventType: 'WORKSHOP',
    locationType: 'VIRTUAL',
    locationAddress: null,
    locationCoords: null,
    locationVirtualLink: 'https://meet.example.com',
    ownerId: 'owner-1',
    festivalId: null,
    status: 'PUBLISHED',
    approvalStatus: 'APPROVED',
    isRegistrationPaused: false,
    maxUsers: null,
    registrationCount: 0,
    registrationDeadline: null,
    passSendingMode: 'IMMEDIATE',
    collegeRestrictionEnabled: false,
    allowedCollegeIds: [],
    allowedEmailDomains: [],
    collegeMatchMode: 'COLLEGE_ID',
    isFree: false,
    freeCollegeIds: [],
  };

  beforeEach(() => {
    service = new EventService(
      { appendRegistrationRow: jest.fn() } as unknown as GoogleSheetsService,
      { emit: jest.fn() } as unknown as EventEmitter2,
      { trackEvent: jest.fn() } as unknown as AnalyticsService,
      referralService as unknown as ReferralService,
      {} as LocationService,
    );
    jest.clearAllMocks();
  });

  describe('joinEvent', () => {
    it('requires payment when a paid tier is selected on a paid event', async () => {
      prismaMock.eventEntity.findUnique.mockResolvedValue(publishedEvent);
      prismaMock.eventParticipantEntity.findUnique.mockResolvedValue(null);
      prismaMock.ticketTierEntity.findFirst.mockResolvedValue({
        id: 'tier-paid',
        isFree: false,
        price: 499,
        capacity: null,
      });

      await expect(
        service.joinEvent('event-1', 'user-1', [], undefined, 'tier-paid'),
      ).rejects.toThrow(
        'This ticket requires payment. Complete checkout for paid tiers.',
      );
    });

    it('requires payment when no free tier is selected on a paid event', async () => {
      prismaMock.eventEntity.findUnique.mockResolvedValue(publishedEvent);
      prismaMock.eventParticipantEntity.findUnique.mockResolvedValue(null);
      prismaMock.eventPaymentEntity.findFirst.mockResolvedValue(null);
      prismaMock.userOnboardingProfileEntity.findUnique.mockResolvedValue({
        userCategory: 'COLLEGE_STUDENT',
      });

      await expect(
        service.joinEvent('event-1', 'user-1', []),
      ).rejects.toThrow('Payment required');
    });

    it('registers with a free tier without requiring payment', async () => {
      prismaMock.eventEntity.findUnique.mockResolvedValue(publishedEvent);
      prismaMock.eventParticipantEntity.findUnique.mockResolvedValue(null);
      prismaMock.ticketTierEntity.findFirst.mockResolvedValue({
        id: 'tier-free',
        isFree: true,
        price: 0,
        capacity: 10,
      });
      prismaMock.eventParticipantEntity.count.mockResolvedValue(0);
      prismaMock.userOnboardingProfileEntity.findUnique.mockResolvedValue({
        userCategory: 'COLLEGE_STUDENT',
      });
      prismaMock.eventRegistrationFormEntity.findUnique.mockResolvedValue({
        id: 'form-1',
        fields: [
          {
            id: 'f-name',
            label: 'Name',
            type: 'TEXT',
            required: true,
            order: -50,
            options: [],
          },
          {
            id: 'f-email',
            label: 'Email',
            type: 'EMAIL',
            required: true,
            order: -40,
            options: [],
          },
          {
            id: 'f-phone',
            label: 'Phone No.',
            type: 'PHONE_NO',
            required: true,
            order: -30,
            options: [],
          },
          {
            id: 'f-gender',
            label: 'Gender',
            type: 'OPTIONS',
            required: true,
            order: -20,
            options: ['MALE', 'FEMALE'],
          },
          {
            id: 'f-college',
            label: 'College Name',
            type: 'TEXT',
            required: true,
            order: -9,
            options: [],
          },
        ],
      });
      prismaMock.userEntity.findUnique.mockResolvedValue({
        email: 'user@example.com',
        firstName: 'Test',
        onboardingProfile: { collegeId: null },
      });

      const participantCreate = jest
        .fn()
        .mockResolvedValue({ id: 'participant-1' });
      prismaMock.$transaction.mockImplementation(
        async (cb: (tx: unknown) => unknown) =>
          cb({
            eventEntity: {
              findUnique: jest.fn().mockResolvedValue({
                maxUsers: null,
                registrationCount: 0,
              }),
              update: jest.fn(),
            },
            eventParticipantEntity: {
              create: participantCreate,
              update: jest.fn(),
            },
            eventRegistrationSubmissionEntity: {
              findFirst: jest.fn().mockResolvedValue(null),
              create: jest
                .fn()
                .mockResolvedValue({ id: 'submission-1' }),
              update: jest.fn(),
            },
            eventRegistrationAnswerEntity: {
              deleteMany: jest.fn(),
              createMany: jest.fn(),
            },
          }),
      );

      const result = await service.joinEvent(
        'event-1',
        'user-1',
        [
          { fieldId: 'f-name', value: 'Test User' },
          { fieldId: 'f-email', value: 'user@example.com' },
          { fieldId: 'f-phone', value: '9999999999' },
          { fieldId: 'f-gender', value: 'MALE' },
          { fieldId: 'f-college', value: 'Test College' },
        ],
        undefined,
        'tier-free',
      );

      expect(result.message).toContain('Successfully joined');
      expect(participantCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ticketTierId: 'tier-free',
            checkoutPending: false,
          }),
        }),
      );
      expect(prismaMock.eventPaymentEntity.findFirst).not.toHaveBeenCalled();
    });

    it('throws when a free tier is sold out', async () => {
      prismaMock.eventEntity.findUnique.mockResolvedValue(publishedEvent);
      prismaMock.eventParticipantEntity.findUnique.mockResolvedValue(null);
      prismaMock.ticketTierEntity.findFirst.mockResolvedValue({
        id: 'tier-free',
        isFree: true,
        price: 0,
        capacity: 1,
      });
      prismaMock.eventParticipantEntity.count.mockResolvedValue(1);

      await expect(
        service.joinEvent('event-1', 'user-1', [], undefined, 'tier-free'),
      ).rejects.toThrow('This ticket type is sold out');
    });
  });

  describe('checkUserRegistration', () => {
    it('marks paymentCompleted when participant registered on a free tier without payment', async () => {
      prismaMock.eventEntity.findUnique.mockResolvedValue({
        id: 'event-1',
        isFree: false,
        entryFeeAmount: 100,
      });
      prismaMock.eventParticipantEntity.findUnique.mockResolvedValue({
        id: 'participant-1',
        joinedAt: new Date(),
        checkoutPending: false,
        ticketTierId: 'tier-free',
        ticketTier: { id: 'tier-free', name: 'Community', isFree: true },
      });
      prismaMock.eventRegistrationSubmissionEntity.findFirst.mockResolvedValue({
        id: 'sub-1',
        _count: { answers: 1 },
      });
      prismaMock.eventPaymentEntity.findFirst.mockResolvedValue(null);

      const status = await service.checkUserRegistration('event-1', 'user-1');

      expect(status.paymentCompleted).toBe(true);
      expect(status.ticketTierId).toBe('tier-free');
      expect(status.ticketTierName).toBe('Community');
    });
  });
});
