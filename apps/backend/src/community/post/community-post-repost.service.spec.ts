import { ConflictException } from '@nestjs/common';
import { CommunityPostRepostService } from './community-post-repost.service';

jest.mock('@oppskills/db', () => ({
  prisma: {
    communityPostEntity: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    communityPostRepostEntity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

import { prisma } from '@oppskills/db';

describe('CommunityPostRepostService', () => {
  let service: CommunityPostRepostService;

  beforeEach(() => {
    service = new CommunityPostRepostService();
    jest.clearAllMocks();
  });

  it('throws ConflictException when user already reposted', async () => {
    (prisma.communityPostEntity.findFirst as jest.Mock).mockResolvedValue({
      id: 'post-1',
      communityId: 'comm-1',
      repostCount: 2,
    });
    (
      prisma.communityPostRepostEntity.findUnique as jest.Mock
    ).mockResolvedValue({
      id: 'repost-record-1',
    });

    await expect(
      service.createRepost('user-1', 'comm-1', 'post-1', {}),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('batchIsReposted returns map of reposted posts', async () => {
    (prisma.communityPostRepostEntity.findMany as jest.Mock).mockResolvedValue([
      { originalPostId: 'post-1' },
    ]);

    const result = await service.batchIsReposted(
      ['post-1', 'post-2'],
      'user-1',
    );

    expect(result['post-1']).toBe(true);
    expect(result['post-2']).toBe(false);
  });
});
