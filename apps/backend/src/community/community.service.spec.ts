import 'reflect-metadata';
import { CommunityService } from './community.service';
import { prisma } from '@oppskills/db';

jest.mock('@oppskills/db', () => ({
  prisma: {
    communityEntity: {
      findUnique: jest.fn(),
    },
    userEntity: {
      findMany: jest.fn(),
    },
    communityMemberEntity: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
    },
    communityPostEntity: {
      aggregate: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('CommunityService', () => {
  let service: CommunityService;
  const mockEmailQueue = {
    addCommunityWelcomeBatch: jest.fn(),
  };
  const mockAnalyticsService = {
    trackCommunityView: jest.fn(),
    getLiveCommunityPageViews: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CommunityService(
      mockEmailQueue as any,
      mockAnalyticsService as any,
    );
    (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
      id: 'comm1',
      ownerId: 'user1',
      members: [{ id: 'mem1', accessControlRole: 'ADMIN' }],
    });
  });

  describe('addMembersToCommunity', () => {
    it('throws error if current user adds themselves', async () => {
      await expect(
        service.addMembersToCommunity('user1', 'comm1', {
          userIds: ['user1'],
          role: 'MEMBER',
          accessControlRole: 'READ_ONLY',
        }),
      ).rejects.toThrow('You cannot add your own user ID');
    });

    it('throws NotFoundException if userIds do not exist in database', async () => {
      (prisma.userEntity.findMany as jest.Mock).mockResolvedValue([
        { id: 'user2' },
      ]);

      await expect(
        service.addMembersToCommunity('user1', 'comm1', {
          userIds: ['user2', 'user3'],
          role: 'MEMBER',
          accessControlRole: 'READ_ONLY',
        }),
      ).rejects.toThrow('The following user IDs do not exist: user3');
    });

    it('successfully queues emails in chunks of 100 when adding members', async () => {
      const userIds = Array.from({ length: 250 }, (_, i) => `user_${i + 2}`);
      (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'comm1',
        ownerId: 'user1',
        members: [{ id: 'mem1', accessControlRole: 'ADMIN' }],
      });
      (prisma.userEntity.findMany as jest.Mock).mockResolvedValue(
        userIds.map((id) => ({ id })),
      );
      (prisma.communityMemberEntity.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prisma.communityMemberEntity.createMany as jest.Mock).mockResolvedValue({
        count: 250,
      });

      const result = await service.addMembersToCommunity('user1', 'comm1', {
        userIds,
        role: 'MEMBER',
        accessControlRole: 'READ_ONLY',
      });

      expect(result).toEqual({ success: true, count: 250 });
      expect(prisma.communityMemberEntity.createMany).toHaveBeenCalledWith({
        data: userIds.map((uid) => ({
          communityId: 'comm1',
          userId: uid,
          role: 'MEMBER',
          accessControlRole: 'READ_ONLY',
        })),
      });

      // Verify chunking: 250 users should be chunked into 3 batches (100, 100, 50)
      expect(mockEmailQueue.addCommunityWelcomeBatch).toHaveBeenCalledTimes(3);
      expect(mockEmailQueue.addCommunityWelcomeBatch).toHaveBeenNthCalledWith(
        1,
        'comm1',
        userIds.slice(0, 100),
      );
      expect(mockEmailQueue.addCommunityWelcomeBatch).toHaveBeenNthCalledWith(
        2,
        'comm1',
        userIds.slice(100, 200),
      );
      expect(mockEmailQueue.addCommunityWelcomeBatch).toHaveBeenNthCalledWith(
        3,
        'comm1',
        userIds.slice(200, 250),
      );
    });

    it('allows MODERATOR to add members with READ_ONLY access', async () => {
      (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'comm1',
        ownerId: 'user99',
        members: [{ id: 'mem1', accessControlRole: 'MODERATOR' }],
      });
      (prisma.userEntity.findMany as jest.Mock).mockResolvedValue([
        { id: 'user2' },
      ]);
      (prisma.communityMemberEntity.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prisma.communityMemberEntity.createMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const result = await service.addMembersToCommunity('user1', 'comm1', {
        userIds: ['user2'],
        role: 'MEMBER',
        accessControlRole: 'READ_ONLY',
      });
      expect(result.success).toBe(true);
    });

    it('throws ForbiddenException if MODERATOR tries to add members with ADMIN access', async () => {
      (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'comm1',
        ownerId: 'user99',
        members: [{ id: 'mem1', accessControlRole: 'MODERATOR' }],
      });

      await expect(
        service.addMembersToCommunity('user1', 'comm1', {
          userIds: ['user2'],
          role: 'MEMBER',
          accessControlRole: 'ADMIN',
        }),
      ).rejects.toThrow(
        'Moderators can only add members with READ_ONLY access',
      );
    });

    it('throws ForbiddenException if READ_ONLY tries to add members', async () => {
      (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'comm1',
        ownerId: 'user99',
        members: [{ id: 'mem1', accessControlRole: 'READ_ONLY' }],
      });

      await expect(
        service.addMembersToCommunity('user1', 'comm1', {
          userIds: ['user2'],
          role: 'MEMBER',
          accessControlRole: 'READ_ONLY',
        }),
      ).rejects.toThrow(
        'You do not have permission to modify data in this community',
      );
    });
  });

  describe('getCommunityStats', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockAnalyticsService.getLiveCommunityPageViews.mockResolvedValue(0);
      (prisma.communityPostEntity.aggregate as jest.Mock).mockResolvedValue({
        _sum: { impressions: 0, views: 0 },
      });
    });

    it('returns community statistics correctly', async () => {
      (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'comm1',
        ownerId: 'user1',
        createdAt: new Date(),
        members: [{ id: 'mem1', accessControlRole: 'ADMIN' }],
      });

      (prisma.communityMemberEntity.count as jest.Mock).mockImplementation(
        async ({ where }) => {
          if (where.userId === 'user1') {
            return 1; // hasOwnerInMembers is true
          }
          if (where.accessControlRole === 'FOLLOWER') {
            return 4;
          }
          if (where.accessControlRole === 'ADMIN') {
            return 2;
          }
          if (where.accessControlRole === 'MODERATOR') {
            return 3;
          }
          if (where.createdAt) {
            return 5; // new members in last 30 days
          }
          return 10; // total internal members
        },
      );

      const stats = await service.getCommunityStats('user1', 'comm1');
      expect(stats).toEqual({
        totalMembers: 10,
        followerCount: 4,
        rosterCount: 14,
        newMembers30Days: 5,
        pageImpressions: 0,
        postImpressions: 0,
        postViews: 0,
        adminCount: 2,
        moderatorCount: 3,
      });
    });

    it('safely handles legacy communities where owner is not in members', async () => {
      const commCreatedAt = new Date();
      (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'comm1',
        ownerId: 'user1',
        createdAt: commCreatedAt,
        members: [{ id: 'mem1', accessControlRole: 'ADMIN' }],
      });

      (prisma.communityMemberEntity.count as jest.Mock).mockImplementation(
        async ({ where }) => {
          if (where.userId === 'user1') {
            return 0; // hasOwnerInMembers is false
          }
          if (where.accessControlRole === 'FOLLOWER') {
            return 2;
          }
          if (where.accessControlRole === 'ADMIN') {
            return 1;
          }
          if (where.accessControlRole === 'MODERATOR') {
            return 2;
          }
          if (where.createdAt) {
            return 3; // new members in last 30 days
          }
          return 5; // total internal members (excluding owner)
        },
      );

      const stats = await service.getCommunityStats('user1', 'comm1');
      expect(stats).toEqual({
        totalMembers: 6, // totalMembersDb + 1
        followerCount: 2,
        rosterCount: 8,
        newMembers30Days: 4, // newMembers30DaysDb + 1
        pageImpressions: 0,
        postImpressions: 0,
        postViews: 0,
        adminCount: 2, // adminCountDb + 1
        moderatorCount: 2,
      });
    });
  });

  describe('listPublicMembers', () => {
    it('returns public community members successfully', async () => {
      (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'comm1',
        ownerId: 'user1',
        createdAt: new Date(),
      });

      (prisma.communityMemberEntity.count as jest.Mock).mockResolvedValue(1);
      (prisma.communityMemberEntity.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mem1',
          userId: 'user1',
          role: 'OWNER',
          createdAt: new Date(),
          user: {
            id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            imageUrl: 'avatar.jpg',
            onboardingProfile: {
              skills: ['Coding'],
              interests: ['Tech'],
              userCategory: 'COLLEGE_STUDENT',
              jobTitle: 'Developer',
              companyName: 'ACME',
              college: { name: 'Harvard' },
            },
          },
        },
      ]);

      const result = await service.listPublicMembers('test-handle', {
        page: 1,
        take: 10,
      });
      expect(result.items.length).toBe(1);
      expect(result.items[0].name).toBe('John Doe');
      expect(result.items[0].role).toBe('OWNER');
      expect(result.items[0].skills).toEqual(['Coding']);
      expect(result.items[0].interests).toEqual(['Tech']);
    });
  });

  describe('getPublicProfileByHandle', () => {
    it('returns correct memberCount counting all members and accounting for legacy owner', async () => {
      (prisma.communityEntity.findUnique as jest.Mock).mockResolvedValue({
        id: 'comm1',
        ownerId: 'owner_user',
        name: 'Test Community',
        handle: 'test-community',
        createdAt: new Date(),
      });

      (prisma.communityMemberEntity.count as jest.Mock)
        .mockResolvedValueOnce(3) // dbCount = 3
        .mockResolvedValueOnce(0); // hasOwner = false (legacy owner)

      (prisma.communityPostEntity.count as jest.Mock)
        .mockResolvedValueOnce(2) // originalPostCount
        .mockResolvedValueOnce(1); // repostCount

      const result = await service.getPublicProfileByHandle('test-community');
      expect(result.memberCount).toBe(4); // 3 + 1 (legacy owner)
      expect(result.postCount).toBe(2);
      expect(result.repostCount).toBe(1);
    });
  });
});
