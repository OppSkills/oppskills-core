import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import type { Prisma } from '@oppskills/db';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly redis: Redis) {}

  async trackPageView(type: 'event' | 'opportunity', slug: string) {
    this.redis.incr(`pv:${type}:${slug}`).catch(() => {});
  }

  async flushToDb() {
    const stream = this.redis.scanStream({
      match: 'pv:*',
      count: 100,
    });

    for await (const keys of stream) {
      for (const key of keys) {
        const value = await this.redis.get(key);
        if (!value) continue;

        const count = Number(value);
        const [, type, slug] = key.split(':');

        try {
          if (type === 'event') {
            await prisma.eventEntity.update({
              where: { slug },
              data: { views: { increment: count } },
            });
          }

          if (type === 'opportunity') {
            await prisma.hackathonEntity.update({
              where: { slug },
              data: { views: { increment: count } },
            });
          }

          await this.redis.del(key);
        } catch (err) {
          this.logger.error(`Failed flushing ${key}`, err);
        }
      }
    }
  }
}
