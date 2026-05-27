import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { prisma } from '@oppskills/db';
import { CacheService } from '../common/cache.service';

jest.mock('@oppskills/db', () => ({
  prisma: {
    eventEntity: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    hackathonEntity: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    eventParticipantEntity: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    hackathonRegistrationSubmissionEntity: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    eventPaymentEntity: {
      findMany: jest.fn(),
    },
    hackathonPaymentEntity: {
      findMany: jest.fn(),
    },
    hackathonUserRoleEntity: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    eventUserRoleEntity: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    notifications: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    referralEntity: {
      findMany: jest.fn(),
    },
    teamRoundQualificationEntity: {
      count: jest.fn(),
    },
    razorpayRouteAccountEntity: {
      count: jest.fn(),
    },
    userOnboardingProfileEntity: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: CacheService,
          useValue: {
            getClient: () => ({
              incr: jest.fn(),
              scanStream: jest.fn(),
              eval: jest.fn(),
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEventDetailedStats', () => {
    it('should return detailed stats for owner', async () => {
      const slug = 'test-event';
      const userId = 'user-123';
      const eventId = 'event-123';

      (prisma.eventEntity.findFirst as jest.Mock).mockResolvedValue({
        id: eventId,
        slug,
        ownerId: userId,
        registrationCount: 10,
        views: BigInt(100),
        impressions: BigInt(200),
        userRoles: [],
      });

      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      // Mock oldest registration to 5 days ago for resolveRange('all_time') to get exactly 7 days
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      (prisma.eventParticipantEntity.findFirst as jest.Mock).mockResolvedValue({
        joinedAt: fiveDaysAgo,
      });

      (prisma.eventParticipantEntity.findMany as jest.Mock).mockResolvedValue([
        { joinedAt: now, user: { onboardingProfile: { gender: 'MALE' } } },
        { joinedAt: now, user: { onboardingProfile: { gender: 'FEMALE' } } }, // 2 today
        { joinedAt: yesterday, user: { onboardingProfile: { gender: 'MALE' } } }, // 1 yesterday
      ]);

      // Mock gender stats
      (
        prisma.userOnboardingProfileEntity.groupBy as jest.Mock
      ).mockResolvedValue([
        { gender: 'MALE', _count: { gender: 10 } },
        { gender: 'FEMALE', _count: { gender: 5 } },
      ]);

      const result = await service.getEventDetailedStats(slug, userId);

      expect(result).toBeDefined();

      // Verify registrations structure
      expect(result?.registrations).toHaveLength(7);

      // Check today's count (last item)
      const todayKey = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
      expect(result?.registrations[6]).toEqual({
        date: todayKey,
        men: 1,
        women: 1,
        other: 0,
      });

      // Verify gender stats
      expect(result?.gender).toEqual({
        male: 10,
        female: 5,
        other: 0,
      });
    });

    it('should return null if user is not owner/manager', async () => {
      const slug = 'test-event';
      const userId = 'other-user';

      (prisma.eventEntity.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await service.getEventDetailedStats(slug, userId);
      expect(result).toBeNull();
    });
  });

  describe('Organizer Summaries', () => {
    const userId = 'organizer-123';

    beforeEach(() => {
      // Mock eventIds and hackathonIds resolution
      (prisma.eventEntity.findMany as jest.Mock).mockResolvedValue([{ id: 'event-1' }, { id: 'event-2' }]);
      (prisma.hackathonEntity.findMany as jest.Mock).mockResolvedValue([{ id: 'hackathon-1' }]);
    });

    it('should return registrations summary', async () => {
      (prisma.eventParticipantEntity.findMany as jest.Mock).mockResolvedValue([
        { approved: true },
        { approved: false },
        { approved: true },
      ]);
      (prisma.hackathonRegistrationSubmissionEntity.count as jest.Mock).mockResolvedValue(5);

      const result = await service.getRegistrationsSummary(userId);
      expect(result).toEqual({
        totalRegistrations: 8,
        pendingReview: 1,
        approved: 7,
      });
    });

    it('should return opportunities summary', async () => {
      const now = new Date();
      const approvedAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later

      // 1 draft event, 1 published event, 1 published hackathon
      (prisma.eventEntity.findMany as jest.Mock).mockResolvedValue([
        { status: 'DRAFT', createdAt: now, approvalApprovedAt: null },
        { status: 'PUBLISHED', createdAt: now, approvalApprovedAt: approvedAt },
      ]);
      (prisma.hackathonEntity.findMany as jest.Mock).mockResolvedValue([
        { status: 'ONGOING', createdAt: now, approvalApprovedAt: approvedAt },
      ]);

      const result = await service.getOpportunitiesSummary(userId);
      expect(result).toEqual({
        draftsInProgress: 1,
        readyToPublish: 2,
        avgSetupTime: '2.0 days',
      });
    });

    it('should return payments summary', async () => {
      (prisma.eventPaymentEntity.findMany as jest.Mock).mockResolvedValue([
        { grossAmount: 100, organizerShareAmount: 80, paymentStatus: 'CAPTURED', transferStatus: 'PAID', transferOnHold: false, refundedAmount: 0 },
        { grossAmount: 50, organizerShareAmount: 40, paymentStatus: 'CAPTURED', transferStatus: 'PENDING', transferOnHold: true, refundedAmount: 0 },
      ]);
      (prisma.hackathonPaymentEntity.findMany as jest.Mock).mockResolvedValue([
        { grossAmount: 200, organizerShareAmount: 160, paymentStatus: 'CAPTURED', transferStatus: 'PENDING', transferOnHold: false, refundedAmount: 0 },
        { grossAmount: 100, organizerShareAmount: 80, paymentStatus: 'REFUNDED', transferStatus: 'PENDING', transferOnHold: false, refundedAmount: 100 },
      ]);

      const result = await service.getPaymentsSummary(userId);
      expect(result).toEqual({
        totalCollected: 350,
        pendingPayout: 200,
        refunds: 100,
      });
    });

    it('should return roles summary', async () => {
      (prisma.eventParticipantEntity.findMany as jest.Mock).mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);
      (prisma.hackathonRegistrationSubmissionEntity.findMany as jest.Mock).mockResolvedValue([{ userId: 'user-2' }, { userId: 'user-3' }]);
      (prisma.userOnboardingProfileEntity.findMany as jest.Mock).mockResolvedValue([{ collegeId: 'college-a' }, { collegeId: 'college-b' }]);
      (prisma.hackathonUserRoleEntity.count as jest.Mock).mockResolvedValue(2);
      (prisma.eventUserRoleEntity.count as jest.Mock).mockResolvedValue(1);

      const result = await service.getRolesSummary(userId);
      expect(result).toEqual({
        verifiedCampuses: 2,
        adminSeats: 3,
        renewalsDue: 0,
      });
    });

    it('should return notifications summary', async () => {
      (prisma.notifications.count as jest.Mock).mockResolvedValue(3);
      (prisma.notifications.findMany as jest.Mock).mockResolvedValue([
        { successCount: 10 },
        { successCount: 5 },
      ]);

      const result = await service.getNotificationsSummary(userId);
      expect(result).toEqual({
        queuedAlerts: 3,
        sentToday: 15,
        openRate: 0.0,
      });
    });

    it('should return referrals summary', async () => {
      (prisma.referralEntity.findMany as jest.Mock).mockResolvedValue([
        { registrationsCount: 4 },
        { registrationsCount: 2 },
      ]);

      const result = await service.getReferralsSummary(userId);
      expect(result).toEqual({
        totalReferrals: 2,
        converted: 6,
        rewardsIssued: 0,
      });
    });

    it('should return pipeline summary', async () => {
      (prisma.eventParticipantEntity.findMany as jest.Mock).mockResolvedValue([
        { approved: true },
      ]);
      (prisma.hackathonRegistrationSubmissionEntity.count as jest.Mock).mockResolvedValue(2);
      (prisma.teamRoundQualificationEntity.count as jest.Mock).mockResolvedValue(4);

      const result = await service.getPipelineSummary(userId);
      expect(result).toEqual({
        totalRegistrations: 3,
        shortlisted: 4,
        waitlisted: 0,
      });
    });

    it('should return settings summary', async () => {
      (prisma.razorpayRouteAccountEntity.count as jest.Mock).mockResolvedValue(1);
      (prisma.hackathonUserRoleEntity.findMany as jest.Mock).mockResolvedValue([{ userId: 'user-a' }]);
      (prisma.eventUserRoleEntity.findMany as jest.Mock).mockResolvedValue([{ userId: 'user-b' }, { userId: 'organizer-123' }]);

      const result = await service.getSettingsSummary(userId);
      expect(result).toEqual({
        activeIntegrations: 1, // Sheets config env not set in test environment, so only 1 Razorpay Route Account
        teamMembers: 2, // 'user-a' and 'user-b' (organizer-123 is excluded)
      });
    });
  });
});
