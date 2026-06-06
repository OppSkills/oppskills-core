import { Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { CacheService } from '../../common/cache.service';

const FEED_TTL_MS = 60_000;
const POST_TTL_MS = 60_000;
const TIMELINE_TTL_SEC = 86_400;

@Injectable()
export class CommunityPostCacheService {
  private readonly redis: Redis | null;

  constructor(cacheService: CacheService) {
    this.redis = cacheService.tryGetClient();
  }

  private timelineKey(communityId: string): string {
    return `cp:tl:${communityId}`;
  }

  private feedKey(communityId: string, cursor: string, take: number): string {
    return `cp:feed:${communityId}:${cursor}:${take}`;
  }

  private postKey(postId: string): string {
    return `cp:post:${postId}`;
  }

  async getFeedPage<T>(
    communityId: string,
    cursor: string,
    take: number,
  ): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(
        this.feedKey(communityId, cursor, take),
      );
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setFeedPage(
    communityId: string,
    cursor: string,
    take: number,
    value: unknown,
  ): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(
        this.feedKey(communityId, cursor, take),
        JSON.stringify(value),
        'PX',
        FEED_TTL_MS,
      );
    } catch {
      // graceful degradation
    }
  }

  async invalidateCommunityFeed(communityId: string): Promise<void> {
    if (!this.redis) return;
    try {
      const stream = this.redis.scanStream({
        match: `cp:feed:${communityId}:*`,
        count: 100,
      });
      for await (const keys of stream) {
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch {
      // graceful degradation
    }
  }

  async addToTimeline(
    communityId: string,
    postId: string,
    createdAt: Date,
  ): Promise<void> {
    if (!this.redis) return;
    try {
      const key = this.timelineKey(communityId);
      await this.redis.zadd(key, createdAt.getTime(), postId);
      await this.redis.expire(key, TIMELINE_TTL_SEC);
    } catch {
      // graceful degradation
    }
  }

  async removeFromTimeline(
    communityId: string,
    postId: string,
  ): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.zrem(this.timelineKey(communityId), postId);
    } catch {
      // graceful degradation
    }
  }

  async getTimelinePostIds(
    communityId: string,
    maxScore: number,
    take: number,
  ): Promise<string[]> {
    if (!this.redis) return [];
    try {
      const key = this.timelineKey(communityId);
      const exists = await this.redis.exists(key);
      if (!exists) return [];
      return this.redis.zrevrangebyscore(
        key,
        maxScore === Infinity ? '+inf' : maxScore - 1,
        '-inf',
        'LIMIT',
        0,
        take,
      );
    } catch {
      return [];
    }
  }

  async hydrateTimeline(
    communityId: string,
    postIds: Array<{ id: string; createdAt: Date }>,
  ): Promise<void> {
    if (!this.redis || postIds.length === 0) return;
    try {
      const key = this.timelineKey(communityId);
      const pipeline = this.redis.pipeline();
      for (const post of postIds) {
        pipeline.zadd(key, post.createdAt.getTime(), post.id);
      }
      pipeline.expire(key, TIMELINE_TTL_SEC);
      await pipeline.exec();
    } catch {
      // graceful degradation
    }
  }

  async getPost<T>(postId: string): Promise<T | null> {
    if (!this.redis) return null;
    try {
      const raw = await this.redis.get(this.postKey(postId));
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async setPost(postId: string, value: unknown): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(
        this.postKey(postId),
        JSON.stringify(value),
        'PX',
        POST_TTL_MS,
      );
    } catch {
      // graceful degradation
    }
  }

  async invalidatePost(postId: string): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.del(this.postKey(postId));
    } catch {
      // graceful degradation
    }
  }
}
