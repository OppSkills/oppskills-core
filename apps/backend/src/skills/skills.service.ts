import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { prisma, Prisma } from '@oppskills/db';
import { CacheService } from '../common/cache.service';
import type Redis from 'ioredis';

@Injectable()
export class SkillsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SkillsService.name);
  private readonly flushInterval: NodeJS.Timeout;
  private readonly redis: Redis;
  private skills: Array<{
    id: string;
    name: string;
    slug: string;
    platformScore: number;
  }> = [];

  constructor(cacheService: CacheService) {
    this.redis = cacheService.getClient();
    // Flush to DB every 5 minutes (300,000ms)
    this.flushInterval = setInterval(() => {
      this.flushScoresToDb().catch((err) =>
        this.logger.error('Failed to flush skill scores to DB', err),
      );
    }, 300_000);
  }

  async onModuleInit() {
    await this.loadSkillsCache();
  }

  onModuleDestroy() {
    clearInterval(this.flushInterval);
  }

  async loadSkillsCache() {
    try {
      this.skills = await prisma.skillEntity.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          platformScore: true,
        },
      });
      this.logger.log(`Loaded ${this.skills.length} skills into memory cache.`);
    } catch (error) {
      this.logger.error('Failed to load skills cache from DB', error);
    }
  }

  searchSkills(q?: string, limit?: number) {
    const clampedLimit = Math.max(1, Math.min(10, limit ?? 5));
    if (!q || q.trim().length === 0) {
      return this.skills
        .sort((a, b) => b.platformScore - a.platformScore)
        .slice(0, clampedLimit);
    }

    const query = q.trim().toLowerCase();
    return this.skills
      .filter((s) => s.name.toLowerCase().includes(query))
      .sort((a, b) => b.platformScore - a.platformScore)
      .slice(0, clampedLimit);
  }

  recommendSkills(text?: string, limit?: number) {
    const clampedLimit = Math.max(1, Math.min(10, limit ?? 5));
    if (!text || text.trim().length === 0) {
      return this.skills
        .sort((a, b) => b.platformScore - a.platformScore)
        .slice(0, 5); // Fallback to top 5
    }

    const content = text.trim();
    const matches = this.skills.filter((s) => {
      const name = s.name;
      const escaped = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const startBoundary = /^\w/.test(name) ? '\\b' : '';
      const endBoundary = /\w$/.test(name) ? '\\b' : '';
      const regex = new RegExp(startBoundary + escaped + endBoundary, 'i');
      return regex.test(content);
    });

    if (matches.length === 0) {
      return this.skills
        .sort((a, b) => b.platformScore - a.platformScore)
        .slice(0, 5); // Fallback to top 5
    }

    // Sort by name length desc (longest match first) to prioritize e.g. "React Native" over "React"
    // and secondarily by platformScore desc
    return matches
      .sort((a, b) => {
        if (b.name.length !== a.name.length) {
          return b.name.length - a.name.length;
        }
        return b.platformScore - a.platformScore;
      })
      .slice(0, clampedLimit);
  }

  async incrementSkillScores(skillIds: string[]): Promise<void> {
    if (!skillIds || skillIds.length === 0) return;
    try {
      const pipeline = this.redis.pipeline();
      for (const id of skillIds) {
        pipeline.incr(`skills:score:${id}`);
      }
      await pipeline.exec();
      this.logger.log(
        `Incremented scores in Redis for skills: ${skillIds.join(', ')}`,
      );
    } catch (err) {
      this.logger.error('Failed to increment skill scores in Redis', err);
    }
  }

  async flushScoresToDb(): Promise<void> {
    this.logger.log(
      'Starting periodic flush of skill scores from Redis to PostgreSQL...',
    );
    const stream = this.redis.scanStream({
      match: 'skills:score:*',
      count: 200,
    });

    let flushedCount = 0;

    for await (const keys of stream) {
      if (keys.length === 0) continue;

      await Promise.all(
        keys.map(async (key) => {
          const parts = key.split(':');
          if (parts.length < 3) return;

          const skillId = parts[2];
          const value = await this.redis.eval(
            `
            local t = redis.call('TYPE', KEYS[1]).ok
            if t == 'string' then
              local v = redis.call('GET', KEYS[1])
              redis.call('DEL', KEYS[1])
              return v
            end
            return nil
            `,
            1,
            key,
          );

          if (!value) return;
          const count = Number(value);
          if (!Number.isFinite(count) || count <= 0) return;

          try {
            await prisma.skillEntity.update({
              where: { id: skillId },
              data: {
                platformScore: { increment: count },
              },
            });
            flushedCount++;
            this.logger.log(
              `Flushed ${count} points to skill ${skillId} (DB platformScore incremented).`,
            );
          } catch (err) {
            const isRecordNotFound =
              err instanceof Prisma.PrismaClientKnownRequestError &&
              err.code === 'P2025';

            if (isRecordNotFound) {
              this.logger.warn(
                `Skill ${skillId} not found in DB. Dropping ${count} score stats for ${key}.`,
              );
            } else {
              this.logger.error(
                `Failed to update skill stats for ${skillId}, re-queueing to Redis`,
                err,
              );
              await this.redis.incrby(key, count).catch((redisErr) => {
                this.logger.error(
                  `CRITICAL: Failed to re-queue ${key} to Redis`,
                  redisErr,
                );
              });
            }
          }
        }),
      );
    }

    if (flushedCount > 0) {
      this.logger.log(
        `Completed flush of ${flushedCount} skills. Reloading memory cache...`,
      );
      await this.loadSkillsCache();
    } else {
      this.logger.log('No skill scores to flush.');
    }
  }
}
