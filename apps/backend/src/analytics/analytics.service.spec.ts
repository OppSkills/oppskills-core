import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { prisma } from '@oppskills/db';

jest.mock('@oppskills/db', () => ({
  prisma: {
    eventEntity: {
      findUnique: jest.fn(),
    },
    eventParticipantEntity: {
      findMany: jest.fn(),
    },
    userOnboardingProfileEntity: {
      groupBy: jest.fn(),
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
          provide: 'REDIS',
          useValue: {
            incr: jest.fn(),
            scanStream: jest.fn(),
            eval: jest.fn(),
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

      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue({
        id: eventId,
        slug,
        ownerId: userId,
        registrationCount: 10,
        views: BigInt(100),
        impressions: BigInt(200),
        userRoles: [],
      });

      // Mock registrations for today and yesterday
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      (prisma.eventParticipantEntity.findMany as jest.Mock).mockResolvedValue([
        { joinedAt: now },
        { joinedAt: now }, // 2 today
        { joinedAt: yesterday }, // 1 yesterday
      ]);

      // Mock gender stats
      (prisma.userOnboardingProfileEntity.groupBy as jest.Mock).mockResolvedValue([
        { gender: 'MALE', _count: { gender: 10 } },
        { gender: 'FEMALE', _count: { gender: 5 } },
      ]);

      const result = await service.getEventDetailedStats(slug, userId);

      expect(result).toBeDefined();

      // Verify registrations structure
      expect(result?.registrations).toHaveLength(7);

      // Check today's count (last item)
      const todayKey = `${now.getDate().toString().padStart(2, '0')}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getFullYear()}`;
      expect(result?.registrations[6]).toEqual({ [todayKey]: 2 });

      // Verify gender stats
      expect(result?.gender).toEqual({
        male: 10,
        female: 5,
      });
    });

    it('should throw ForbiddenException if user is not owner/manager', async () => {
      const slug = 'test-event';
      const userId = 'other-user';
      const eventId = 'event-123';

      (prisma.eventEntity.findUnique as jest.Mock).mockResolvedValue({
        id: eventId,
        slug,
        ownerId: 'owner-user',
        userRoles: [],
      });

      await expect(service.getEventDetailedStats(slug, userId)).rejects.toThrow('You are not allowed');
    });
  });
});
