import { CommunityPostUserInteractionService } from './community-post-user-interaction.service';

jest.mock('@oppskills/db', () => ({
  prisma: {
    communityPostEntity: {
      findUnique: jest.fn(),
    },
    skillEntity: {
      findMany: jest.fn(),
    },
    communityPostUserInteraction: {
      create: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  },
}));

import { prisma } from '@oppskills/db';

describe('CommunityPostUserInteractionService', () => {
  let service: CommunityPostUserInteractionService;

  beforeEach(() => {
    service = new CommunityPostUserInteractionService();
    jest.clearAllMocks();
  });

  it('records interactions across post skills successfully', async () => {
    (prisma.communityPostEntity.findUnique as jest.Mock).mockResolvedValue({
      id: 'post-123',
      skills: ['TypeScript', 'React'],
    });

    (prisma.skillEntity.findMany as jest.Mock).mockResolvedValue([
      { id: 'skill-ts', name: 'TypeScript' },
      { id: 'skill-react', name: 'React' },
    ]);

    await (service as any).runRecordInteraction('post-123', 'user-456', 'LIKE');

    expect(prisma.communityPostEntity.findUnique).toHaveBeenCalledWith({
      where: { id: 'post-123' },
      select: { skills: true },
    });

    expect(prisma.skillEntity.findMany).toHaveBeenCalledWith({
      where: { name: { in: ['TypeScript', 'React'] } },
      select: { id: true, name: true },
    });

    expect(prisma.communityPostUserInteraction.create).toHaveBeenCalledTimes(2);
    expect(prisma.communityPostUserInteraction.create).toHaveBeenNthCalledWith(
      1,
      {
        data: {
          postId: 'post-123',
          userId: 'user-456',
          skillId: 'skill-ts',
          interactionType: 'LIKE',
          score: 5,
        },
      },
    );
    expect(prisma.communityPostUserInteraction.create).toHaveBeenNthCalledWith(
      2,
      {
        data: {
          postId: 'post-123',
          userId: 'user-456',
          skillId: 'skill-react',
          interactionType: 'LIKE',
          score: 5,
        },
      },
    );

    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it('handles score mapping correctly for all types', () => {
    expect((service as any).getScore('LIKE')).toBe(5);
    expect((service as any).getScore('COMMENT')).toBe(3);
    expect((service as any).getScore('SHARE')).toBe(8);
    expect((service as any).getScore('SAVE')).toBe(10);
    expect((service as any).getScore('REPOST')).toBe(15);
  });

  it('skips interaction if post not found', async () => {
    (prisma.communityPostEntity.findUnique as jest.Mock).mockResolvedValue(
      null,
    );

    await (service as any).runRecordInteraction(
      'post-missing',
      'user-456',
      'LIKE',
    );

    expect(prisma.skillEntity.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('skips interaction if post has no skills', async () => {
    (prisma.communityPostEntity.findUnique as jest.Mock).mockResolvedValue({
      id: 'post-123',
      skills: [],
    });

    await (service as any).runRecordInteraction('post-123', 'user-456', 'LIKE');

    expect(prisma.skillEntity.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('catches and logs transaction errors in recordInteraction without throwing', async () => {
    (prisma.communityPostEntity.findUnique as jest.Mock).mockRejectedValue(
      new Error('DB Connection Timeout'),
    );

    const logErrorSpy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation();

    // Should resolve without throwing because recordInteraction catches internally
    await service.recordInteraction('post-123', 'user-456', 'LIKE');

    // Wait slightly to let internal async task execute
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(logErrorSpy).toHaveBeenCalled();
  });
});
