import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { prisma, Prisma } from '@oppskills/db';
import type Redis from 'ioredis';
import { createHash } from 'crypto';
import { CacheService } from 'src/common/cache.service';

@Injectable()
export class ReferralCounterService implements OnModuleDestroy {
  private readonly logger = new Logger(ReferralCounterService.name);
  private readonly flushInterval: NodeJS.Timeout;
  private readonly redis: Redis;

  constructor(cacheService: CacheService) {
    this.redis = cacheService.getClient();
    this.flushInterval = setInterval(() => {
      this.flushToDb().catch((err) =>
        this.logger.error('Failed to flush referral counters', err),
      );
    }, 60_000);
  }

  onModuleDestroy() {
    clearInterval(this.flushInterval);
  }

  private hashIp(ip: string): string {
    const salt = process.env.REFERRAL_IP_SALT || 'oppskills-referrals';
    return createHash('sha256').update(`${ip}:${salt}`).digest('hex');
  }

  async trackClick(params: {
    referralId: string;
    ip: string;
    userAgent?: string;
    source?: string;
    isBot: boolean;
  }): Promise<void> {
    const ipHash = this.hashIp(params.ip || 'unknown');
    const userAgentHash = createHash('sha256')
      .update(params.userAgent || 'unknown')
      .digest('hex');
    await prisma.referralClickEntity.create({
      data: {
        referralId: params.referralId,
        ipHash,
        userAgentHash,
        source: params.source,
        isBot: params.isBot,
      },
    });

    if (params.isBot) return;

    const rateKey = `ref:ip:${ipHash}:${params.referralId}`;
    const rate = await this.redis.incr(rateKey);
    if (rate === 1) await this.redis.expire(rateKey, 3600);
    if (rate > 10) return;

    const now = Date.now();
    await Promise.all([
      this.redis.incr(`ref:c:${params.referralId}`),
      this.redis.incr(`ref:h:${params.referralId}`),
      this.redis.zadd(`ref:c24:${params.referralId}`, now, `${now}`),
      this.redis.zremrangebyscore(
        `ref:c24:${params.referralId}`,
        0,
        now - 24 * 60 * 60 * 1000,
      ),
      this.redis.expire(`ref:c24:${params.referralId}`, 60 * 60 * 24 * 2),
    ]);
  }

  async incrementRegistration(referralId: string): Promise<void> {
    await this.redis.incr(`ref:reg:${referralId}`);
  }

  async getClicksLast24h(referralId: string): Promise<number> {
    const now = Date.now();
    const start = now - 24 * 60 * 60 * 1000;
    const key = `ref:c24:${referralId}`;
    const count = await this.redis.zcount(key, start, now);
    return Number(count || 0);
  }

  async getBatchClicksLast24h(
    referralIds: string[],
  ): Promise<Record<string, number>> {
    if (referralIds.length === 0) return {};
    const now = Date.now();
    const start = now - 24 * 60 * 60 * 1000;

    const pipeline = this.redis.pipeline();
    for (const id of referralIds) {
      const key = `ref:c24:${id}`;
      pipeline.zcount(key, start, now);
    }

    const results = await pipeline.exec();
    const map: Record<string, number> = {};

    if (results) {
      referralIds.forEach((id, index) => {
        const zcountResult = results[index];
        // results is [ [err, res], [err, res], ... ]
        if (zcountResult && !zcountResult[0] && zcountResult[1] !== null) {
          map[id] = Number(zcountResult[1]);
        } else {
          map[id] = 0;
        }
      });
    }

    return map;
  }

  async flushToDb(): Promise<void> {
    const metrics = ['c', 'h', 'reg'];

    await Promise.all(metrics.map((metric) => this.flushMetricToDb(metric)));
  }

  private async flushMetricToDb(metric: string): Promise<void> {
    const stream = this.redis.scanStream({
      match: `ref:${metric}:*`,
      count: 200,
    });

    for await (const keys of stream) {
      await Promise.all(
        keys.map(async (key) => {
            const parts = key.split(':');
            if (parts.length < 3) return;

            const currentMetric = parts[1];
            if (currentMetric !== metric) return;

            const referralId = parts[2];

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
              if (metric === 'c') {
                await prisma.referralEntity.update({
                  where: { id: referralId },
                  data: {
                    clicksCount: { increment: count },
                    lastClickAt: new Date(),
                  },
                });
              } else if (metric === 'h') {
                await prisma.referralEntity.update({
                  where: { id: referralId },
                  data: {
                    humanClicksCount: { increment: count },
                    lastClickAt: new Date(),
                  },
                });
              } else if (metric === 'reg') {
                await prisma.referralEntity.update({
                  where: { id: referralId },
                  data: {
                    registrationsCount: { increment: count },
                    lastRegistrationAt: new Date(),
                  },
                });
              }
            } catch (err) {
              const isRecordNotFound =
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === 'P2025';

              if (isRecordNotFound) {
                this.logger.warn(
                  `Referral ${referralId} not found in DB. Dropping ${count} ${metric} stats for ${key}.`,
                );
              } else {
                this.logger.error(
                  `Failed to update referral stats for ${referralId}, re-queueing to Redis`,
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
  }
}
