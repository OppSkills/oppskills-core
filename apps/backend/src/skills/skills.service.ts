import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { prisma, Prisma } from '@oppskills/db';
import { CacheService } from '../common/cache.service';
import type Redis from 'ioredis';

/** Shape of a skill stored in the in-memory cache.
 * `regex` is lazily compiled on first use and cached to avoid
 * re-allocating a RegExp on every recommendation request. */
interface CachedSkill {
  id: string;
  name: string;
  slug: string;
  platformScore: number;
  regex?: RegExp;
}

/** Public-facing shape (no internal regex field). */
export type SkillDto = Omit<CachedSkill, 'regex'>;

@Injectable()
export class SkillsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SkillsService.name);
  private readonly flushInterval: NodeJS.Timeout;
  private readonly redis: Redis;
  private skills: CachedSkill[] = [];

  constructor(cacheService: CacheService) {
    this.redis = cacheService.getClient();
    // Flush to DB every 5 minutes (300,000 ms)
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

  async loadSkillsCache(): Promise<void> {
    try {
      const rows = await prisma.skillEntity.findMany({
        select: { id: true, name: true, slug: true, platformScore: true },
        orderBy: { platformScore: 'desc' },
      });
      // Preserve any already-compiled regexes to avoid thrashing after a flush reload.
      const existingById = new Map(this.skills.map((s) => [s.id, s]));
      this.skills = rows.map((row) => ({
        ...row,
        regex: existingById.get(row.id)?.regex,
      }));
      this.logger.log(`Loaded ${this.skills.length} skills into memory cache.`);
    } catch (error) {
      this.logger.error('Failed to load skills cache from DB', error);
    }
  }

  /** Lazily compile and cache the RegExp for a skill. */
  private getSkillRegex(skill: CachedSkill): RegExp {
    if (!skill.regex) {
      const escaped = skill.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const startBoundary = /^\w/.test(skill.name) ? '\\b' : '';
      const endBoundary = /\w$/.test(skill.name) ? '\\b' : '';
      skill.regex = new RegExp(startBoundary + escaped + endBoundary, 'i');
    }
    return skill.regex;
  }

  private toDto(skill: CachedSkill): SkillDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { regex: _, ...dto } = skill;
    return dto;
  }

  /** Keyword search against the in-memory cache — zero DB queries. */
  searchSkills(q?: string, limit?: number): SkillDto[] {
    const clampedLimit = Math.max(1, Math.min(10, limit ?? 10));

    if (!q || q.trim().length === 0) {
      return this.skills.slice(0, clampedLimit).map((s) => this.toDto(s));
    }

    const query = q.trim().toLowerCase();
    const results: SkillDto[] = [];
    for (const skill of this.skills) {
      if (skill.name.toLowerCase().includes(query)) {
        results.push(this.toDto(skill));
        if (results.length >= clampedLimit) break;
      }
    }
    return results;
  }

  /**
   * Returns the top N skills by platformScore.
   * No text scanning — suggestions are purely score-driven.
   * The client is responsible for any personalisation on top of this list.
   */
  recommendSkills(limit?: number): SkillDto[] {
    const clampedLimit = Math.max(1, Math.min(10, limit ?? 10));
    // skills[] is already sorted desc by platformScore from loadSkillsCache
    return this.skills.slice(0, clampedLimit).map((s) => this.toDto(s));
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
        `Incremented Redis scores for skills: ${skillIds.join(', ')}`,
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
      if ((keys as string[]).length === 0) continue;

      // Process SEQUENTIALLY to avoid exhausting the DB connection pool.
      for (const key of keys as string[]) {
        const parts = key.split(':');
        if (parts.length < 3) continue;

        const skillId = parts[2];

        // Atomically read + delete so no concurrent incr can be lost.
        const value = await this.redis.eval(
          `local t = redis.call('TYPE', KEYS[1]).ok
           if t == 'string' then
             local v = redis.call('GET', KEYS[1])
             redis.call('DEL', KEYS[1])
             return v
           end
           return nil`,
          1,
          key,
        );

        if (!value) continue;
        const count = Number(value);
        if (!Number.isFinite(count) || count <= 0) continue;

        try {
          await prisma.skillEntity.update({
            where: { id: skillId },
            data: { platformScore: { increment: count } },
          });
          flushedCount++;
          this.logger.log(`Flushed +${count} points to skill ${skillId}.`);
        } catch (err) {
          const isRecordNotFound =
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === 'P2025';

          if (isRecordNotFound) {
            this.logger.warn(
              `Skill ${skillId} not found; dropping ${count} points for key ${key}.`,
            );
          } else {
            this.logger.error(
              `Failed to update skill ${skillId}; re-queueing ${count} points to Redis.`,
              err,
            );
            await this.redis.incrby(key, count).catch((redisErr) => {
              this.logger.error(
                `CRITICAL: Could not re-queue ${key} to Redis.`,
                redisErr,
              );
            });
          }
        }
      }
    }

    if (flushedCount > 0) {
      this.logger.log(
        `Flush complete: ${flushedCount} skill(s) updated. Reloading memory cache...`,
      );
      await this.loadSkillsCache();
    } else {
      this.logger.log('Flush complete: no pending scores.');
    }
  }
}
