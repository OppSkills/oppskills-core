import { Test, TestingModule } from '@nestjs/testing';
import { CommunityPostService } from './community-post.service';
import { CommunityService } from '../community.service';
import { CommunityPostCacheService } from './community-post-cache.service';
import { CommunityPostLikeService } from './community-post-like.service';
import { CommunityPostRepostService } from './community-post-repost.service';
import { AnalyticsService } from 'src/analytics/analytics.service';
import { SkillsService } from 'src/skills/skills.service';

describe('CommunityPostService', () => {
  let service: CommunityPostService;

  const mockCommunityService = {
    checkCommunityWritePermission: jest.fn(),
  };

  const mockCacheService = {
    addToTimeline: jest.fn(),
    removeFromTimeline: jest.fn(),
    invalidateCommunityFeed: jest.fn(),
    invalidatePost: jest.fn(),
    getFeedPage: jest.fn(),
    setFeedPage: jest.fn(),
    getPost: jest.fn(),
    setPost: jest.fn(),
    hydrateTimeline: jest.fn(),
  };

  const mockLikeService = {
    getDisplayLikeCount: jest.fn(async (_id: string, count: number) => count),
    batchIsLiked: jest.fn(),
  };

  const mockRepostService = {
    batchIsReposted: jest.fn(async () => ({})),
  };

  const mockSkillsService = {
    incrementSkillScores: jest.fn(),
  };

  beforeEach(async () => {
    const mockAnalyticsService = {
      trackServedPosts: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityPostService,
        { provide: CommunityService, useValue: mockCommunityService },
        { provide: CommunityPostCacheService, useValue: mockCacheService },
        { provide: CommunityPostLikeService, useValue: mockLikeService },
        { provide: CommunityPostRepostService, useValue: mockRepostService },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: SkillsService, useValue: mockSkillsService },
      ],
    }).compile();

    service = module.get(CommunityPostService);
  });

  describe('cursor encoding/decoding', () => {
    it('round-trips cursor values', () => {
      const createdAt = new Date('2026-06-06T12:00:00.000Z');
      const id = 'post_abc123';
      const cursor = service.encodeCursor(createdAt, id);
      const decoded = service.decodeCursor(cursor);
      expect(decoded).not.toBeNull();
      expect(decoded!.id).toBe(id);
      expect(decoded!.createdAt.toISOString()).toBe(createdAt.toISOString());
    });

    it('returns null for invalid cursor', () => {
      expect(service.decodeCursor('invalid')).toBeNull();
    });
  });

  describe('personalized cursor encoding/decoding', () => {
    it('round-trips personalized cursor values', () => {
      const createdAt = new Date('2026-06-06T12:00:00.000Z');
      const id = 'post_abc123';
      const score = 15;
      const cursor = service.encodePersonalizedCursor(score, createdAt, id);
      const decoded = service.decodePersonalizedCursor(cursor);
      expect(decoded).not.toBeNull();
      expect(decoded!.score).toBe(score);
      expect(decoded!.id).toBe(id);
      expect(decoded!.createdAt.toISOString()).toBe(createdAt.toISOString());
    });

    it('returns null for invalid personalized cursor', () => {
      expect(service.decodePersonalizedCursor('invalid')).toBeNull();
      expect(
        service.decodePersonalizedCursor('15::invalid-date::post-123'),
      ).toBeNull();
    });
  });
});
