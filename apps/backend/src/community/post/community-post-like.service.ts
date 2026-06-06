import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { prisma, Prisma } from '@oppskills/db';
import type Redis from 'ioredis';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class CommunityPostLikeService implements OnModuleDestroy {
  private readonly logger = new Logger(CommunityPostLikeService.name);
  private readonly redis: Redis | null;
  private readonly flushInterval: NodeJS.Timeout;

  constructor(cacheService: CacheService) {
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
      select: { id: true, likeCount: true },
    });
    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    if (!this.redis) {
      return this.toggleLikeDb(postId, userId, post.likeCount);
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
    }

    const delta = Number((await this.redis.get(this.deltaKey(postId))) || 0);
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
      await prisma.$transaction([
        prisma.communityPostLikeEntity.delete({
          where: { postId_userId: { postId, userId } },
        }),
        prisma.communityPostEntity.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      return { liked: false, likeCount: Math.max(0, currentCount - 1) };
    }

    await prisma.$transaction([
      prisma.communityPostLikeEntity.create({
        data: { postId, userId },
      }),
      prisma.communityPostEntity.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
      }),
    ]);
    return { liked: true, likeCount: currentCount + 1 };
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

    const stream = this.redis.scanStream({
      match: 'cp:like-flush:*',
      count: 100,
    });

    for await (const keys of stream) {
      await Promise.all(
        keys.map(async (key) => {
          const postId = key.replace('cp:like-flush:', '');
          const ops = await this.redis!.smembers(key);
          if (ops.length === 0) return;

          await this.redis!.del(key);

          try {
            await prisma.$transaction(async (tx) => {
              for (const op of ops) {
                const userId = op.slice(1);
                if (op.startsWith('+')) {
                  await tx.communityPostLikeEntity.upsert({
                    where: {
                      postId_userId: { postId, userId },
                    },
                    create: { postId, userId },
                    update: {},
                  });
                } else if (op.startsWith('-')) {
                  await tx.communityPostLikeEntity.deleteMany({
                    where: { postId, userId },
                  });
                }
              }

              const delta = Number(
                (await this.redis!.get(this.deltaKey(postId))) || 0,
              );
              if (delta !== 0) {
                await tx.communityPostEntity.update({
                  where: { id: postId },
                  data: { likeCount: { increment: delta } },
                });
                await this.redis!.del(this.deltaKey(postId));
              }
            });
          } catch (err) {
            if (
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === 'P2025'
            ) {
              this.logger.warn(`Post ${postId} not found during like flush`);
            } else {
              this.logger.error(`Failed to flush likes for post ${postId}`, err);
              for (const op of ops) {
                await this.redis!.sadd(key, op).catch(() => {});
              }
            }
          }
        }),
      );
    }
  }
}
