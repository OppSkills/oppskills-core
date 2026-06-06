import { Test, TestingModule } from '@nestjs/testing';
import { CommunityPostCommentService } from './community-post-comment.service';
import { CommunityService } from '../community.service';
import { CommunityPostCommentLikeService } from './community-post-comment-like.service';
import { CommunityPostCacheService } from './community-post-cache.service';

describe('CommunityPostCommentService', () => {
  let service: CommunityPostCommentService;

  const mockCommunityService = {
    checkCommunityWritePermission: jest.fn(),
  };

  const mockCommentLikeService = {
    getDisplayLikeCount: jest.fn(async (_id: string, count: number) => count),
    batchIsLiked: jest.fn(async () => ({})),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityPostCommentService,
        { provide: CommunityService, useValue: mockCommunityService },
        {
          provide: CommunityPostCommentLikeService,
          useValue: mockCommentLikeService,
        },
        {
          provide: CommunityPostCacheService,
          useValue: { invalidatePost: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(CommunityPostCommentService);
  });

  describe('cursor encoding/decoding', () => {
    it('round-trips cursor values', () => {
      const createdAt = new Date('2026-06-06T12:00:00.000Z');
      const id = 'comment_abc123';
      const cursor = service.encodeCursor(createdAt, id);
      const decoded = service.decodeCursor(cursor);
      expect(decoded).not.toBeNull();
      expect(decoded!.id).toBe(id);
      expect(decoded!.createdAt.toISOString()).toBe(createdAt.toISOString());
    });

    it('returns null for invalid cursor', () => {
      expect(service.decodeCursor('bad-cursor')).toBeNull();
    });
  });
});
