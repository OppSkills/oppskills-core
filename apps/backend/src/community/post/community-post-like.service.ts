import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { prisma, Prisma } from '@oppskills/db';
import type Redis from 'ioredis';
import { CacheService } from '../../common/cache.service';
import { CommunityPostCacheService } from './community-post-cache.service';
import { CommunityPostUserInteractionService } from './community-post-user-interaction.service';

@Injectable()
export class CommunityPostLikeService implements OnModuleDestroy {
  private readonly logger = new Logger(CommunityPostLikeService.name);
  private readonly redis: Redis | null;
  private readonly flushInterval: NodeJS.Timeout;

  constructor(
    cacheService: CacheService,
    private readonly postCacheService: CommunityPostCacheService,
    private readonly interactionService: CommunityPostUserInteractionService,
  ) {
    this.redis = cacheService.tryGetClient();
    this.flushInterval = setInterval(() => {
      this.flushToDb().catch((err) =>
        this.logger.error('Failed to flush community post likes', err),
      );
    }, 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.flushInterval);
  }

  private likedKey(postId: string): string {
    return `cp:liked:${postId}`;
  }

  private deltaKey(postId: string): string {
    return `cp:lc:${postId}`;
  }

  private flushKey(postId: string): string {
    return `cp:like-flush:${postId}`;
  }

  /** Staging key used during flush — must not match the active flush scan pattern. */
  private flushStagingKey(postId: string): string {
    return `cp:like-flush-staging:${postId}`;
  }

  private static netDeltaFromOps(ops: string[]): number {
    let net = 0;
    for (const op of ops) {
      if (op.startsWith('+')) net += 1;
      else if (op.startsWith('-')) net -= 1;
    }
    return net;
  }

  /**
   * Atomically claim the active flush set via RENAME so concurrent toggles
   * recreate the active key instead of being deleted mid-flight.
   */
  private async claimFlushBatch(postId: string): Promise<string | null> {
    if (!this.redis) return null;

    const activeKey = this.flushKey(postId);
    const stagingKey = this.flushStagingKey(postId);

    // Resume a previously staged batch (e.g. crash mid-flush) before claiming new work.
    if ((await this.redis.exists(stagingKey)) === 1) {
      return stagingKey;
    }

    const claimed = await this.redis.eval(
      `
      if redis.call('EXISTS', KEYS[1]) == 0 then
        return 0
      end
      if redis.call('SCARD', KEYS[1]) == 0 then
        return 0
      end
      redis.call('RENAME', KEYS[1], KEYS[2])
      return 1
      `,
      2,
      activeKey,
      stagingKey,
    );

    return claimed === 1 ? stagingKey : null;
  }

  private async flushPostLikes(postId: string): Promise<void> {
    if (!this.redis) return;

    const activeKey = this.flushKey(postId);

    for (;;) {
      const stagingKey = await this.claimFlushBatch(postId);
      if (!stagingKey) break;
      await this.processLikeFlushBatch(postId, activeKey, stagingKey);
    }
  }

  private async processLikeFlushBatch(
    postId: string,
    activeKey: string,
    stagingKey: string,
  ): Promise<void> {
    if (!this.redis) return;

    let ops: string[] = [];
    try {
      ops = await this.redis.smembers(stagingKey);
      if (ops.length === 0) {
        await this.redis.del(stagingKey);
        return;
      }

      const netDelta = CommunityPostLikeService.netDeltaFromOps(ops);

      await prisma.$transaction(async (tx) => {
        for (const op of ops) {
          const userId = op.slice(1);
          if (op.startsWith('+')) {
            await tx.communityPostLikeEntity.upsert({
              where: { postId_userId: { postId, userId } },
              create: { postId, userId },
              update: {},
            });
          } else if (op.startsWith('-')) {
            await tx.communityPostLikeEntity.deleteMany({
              where: { postId, userId },
            });
          }
        }

        const count = await tx.communityPostLikeEntity.count({
          where: { postId },
        });
        await tx.communityPostEntity.update({
          where: { id: postId },
          data: { likeCount: count },
        });
      });

      if (netDelta !== 0) {
        await this.redis.decrby(this.deltaKey(postId), netDelta);
      }
      await this.redis.del(stagingKey);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        this.logger.warn(`Post ${postId} not found during like flush`);
        const netDelta = CommunityPostLikeService.netDeltaFromOps(ops);
        if (netDelta !== 0) {
          await this.redis.decrby(this.deltaKey(postId), netDelta);
        }
        await this.redis.del(stagingKey);
        return;
      }

      this.logger.error(`Failed to flush likes for post ${postId}`, err);
      for (const op of ops) {
        await this.redis.sadd(activeKey, op).catch(() => {});
      }
      await this.redis.del(stagingKey).catch(() => {});
    }
  }

  private async hydrateLikeSet(postId: string): Promise<void> {
    if (!this.redis) return;
    const likes = await prisma.communityPostLikeEntity.findMany({
      where: { postId },
      select: { userId: true },
    });
    if (likes.length === 0) {
      await this.redis.set(this.likedKey(postId), '1', 'EX', 3600);
      await this.redis.del(this.likedKey(postId));
      return;
    }
    const pipeline = this.redis.pipeline();
    for (const like of likes) {
      pipeline.sadd(this.likedKey(postId), like.userId);
    }
    pipeline.expire(this.likedKey(postId), 86_400);
    await pipeline.exec();
  }

  async toggleLike(
    postId: string,
    userId: string,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const post = await prisma.communityPostEntity.findFirst({
      where: { id: postId, status: 'PUBLISHED' },
      select: { id: true, communityId: true, likeCount: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (!this.redis) {
      const result = await this.toggleLikeDb(postId, userId, post.likeCount);
      await this.postCacheService.invalidatePost(postId);
      await this.postCacheService.invalidateCommunityFeed(post.communityId);
      if (result.liked) {
        this.interactionService.recordInteraction(postId, userId, 'LIKE');
      }
      return result;
    }

    const likedKey = this.likedKey(postId);
    const exists = await this.redis.exists(likedKey);
    if (!exists) {
      await this.hydrateLikeSet(postId);
    }

    const wasLiked = (await this.redis.sismember(likedKey, userId)) === 1;

    if (wasLiked) {
      await this.redis.srem(likedKey, userId);
      await this.redis.decr(this.deltaKey(postId));
      await this.redis.sadd(this.flushKey(postId), `-${userId}`);
    } else {
      await this.redis.sadd(likedKey, userId);
      await this.redis.incr(this.deltaKey(postId));
      await this.redis.sadd(this.flushKey(postId), `+${userId}`);
      this.interactionService.recordInteraction(postId, userId, 'LIKE');
    }

    const delta = Number((await this.redis.get(this.deltaKey(postId))) || 0);

    // Invalidate post cache and community feed cache so that subsequent requests fetch fresh values
    await this.postCacheService.invalidatePost(postId);
    await this.postCacheService.invalidateCommunityFeed(post.communityId);

    return {
      liked: !wasLiked,
      likeCount: Math.max(0, post.likeCount + delta),
    };
  }

  private async toggleLikeDb(
    postId: string,
    userId: string,
    currentCount: number,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const existing = await prisma.communityPostLikeEntity.findUnique({
      where: { postId_userId: { postId, userId } },
    });

    if (existing) {
      const updatedCount = await prisma.$transaction(async (tx) => {
        await tx.communityPostLikeEntity.deleteMany({
          where: { postId, userId },
        });
        const count = await tx.communityPostLikeEntity.count({
          where: { postId },
        });
        await tx.communityPostEntity.update({
          where: { id: postId },
          data: { likeCount: count },
        });
        return count;
      });
      return { liked: false, likeCount: updatedCount };
    }

    const updatedCount = await prisma.$transaction(async (tx) => {
      await tx.communityPostLikeEntity.create({
        data: { postId, userId },
      });
      const count = await tx.communityPostLikeEntity.count({
        where: { postId },
      });
      await tx.communityPostEntity.update({
        where: { id: postId },
        data: { likeCount: count },
      });
      return count;
    });
    return { liked: true, likeCount: updatedCount };
  }

  async batchIsLiked(
    postIds: string[],
    userId: string,
  ): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};
    if (postIds.length === 0) return result;

    if (!this.redis) {
      const likes = await prisma.communityPostLikeEntity.findMany({
        where: { postId: { in: postIds }, userId },
        select: { postId: true },
      });
      const likedSet = new Set(likes.map((l) => l.postId));
      for (const id of postIds) {
        result[id] = likedSet.has(id);
      }
      return result;
    }

    const pipeline = this.redis.pipeline();
    for (const postId of postIds) {
      pipeline.exists(this.likedKey(postId));
    }
    const existsResults = await pipeline.exec();

    const hydratePromises: Promise<void>[] = [];
    for (let i = 0; i < postIds.length; i++) {
      const postId = postIds[i];
      const existsResult = existsResults?.[i];
      const keyExists =
        existsResult && !existsResult[0] && Number(existsResult[1]) === 1;
      if (!keyExists) {
        hydratePromises.push(this.hydrateLikeSet(postId));
      }
    }
    await Promise.all(hydratePromises);

    const checkPipeline = this.redis.pipeline();
    for (const postId of postIds) {
      checkPipeline.sismember(this.likedKey(postId), userId);
    }
    const checkResults = await checkPipeline.exec();

    for (let i = 0; i < postIds.length; i++) {
      const checkResult = checkResults?.[i];
      result[postIds[i]] =
        !!checkResult && !checkResult[0] && Number(checkResult[1]) === 1;
    }
    return result;
  }

  async getDisplayLikeCount(
    postId: string,
    dbLikeCount: number,
  ): Promise<number> {
    if (!this.redis) return dbLikeCount;
    const delta = Number((await this.redis.get(this.deltaKey(postId))) || 0);
    return Math.max(0, dbLikeCount + delta);
  }

  async flushToDb(): Promise<void> {
    if (!this.redis) return;

    const postIds = new Set<string>();

    for (const pattern of [
      'cp:like-flush-staging:*',
      'cp:like-flush:*',
    ] as const) {
      const stream = this.redis.scanStream({ match: pattern, count: 100 });
      for await (const keys of stream) {
        for (const key of keys as string[]) {
          if (pattern === 'cp:like-flush-staging:*') {
            postIds.add(key.slice('cp:like-flush-staging:'.length));
          } else if (/^cp:like-flush:[^:]+$/.test(key)) {
            postIds.add(key.slice('cp:like-flush:'.length));
          }
        }
      }
    }

    await Promise.all(
      [...postIds].map((postId) => this.flushPostLikes(postId)),
    );
  }
}
