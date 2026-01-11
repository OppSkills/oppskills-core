import { Inject, Injectable, Logger } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(@Inject('REDIS') private readonly redis: Redis) { }

  async trackPageView(type: 'event' | 'opportunity', slug: string) {
    this.redis.incr(`pv:${type}:${slug}`).catch(() => { });
  }

  async trackPostImpression(type: 'event' | 'opportunity', slug: string) {
    this.redis.incr(`pi:${type}:${slug}`).catch(() => { });
  }

  async flushToDb() {
    const stream = this.redis.scanStream({
      match: '*:*:*', // matches pv:*:* and pi:*:*
      count: 200,
    });

    for await (const keys of stream) {
      for (const key of keys) {
        const value = await this.redis.get(key);
        if (!value) continue;

        const count = Number(value);
        const [metric, type, slug] = key.split(':');

        try {
          if (type === 'event') {
            await prisma.eventEntity.update({
              where: { slug },
              data: {
                ...(metric === 'pv' && { views: { increment: count } }),
                ...(metric === 'pi' && { impressions: { increment: count } }),
              },
            });
          }

          if (type === 'opportunity') {
            await prisma.hackathonEntity.update({
              where: { slug },
              data: {
                ...(metric === 'pv' && { views: { increment: count } }),
                ...(metric === 'pi' && { impressions: { increment: count } }),
              },
            });
          }

          await this.redis.del(key);
        } catch (err) {
          this.logger.error(`Failed flushing ${key}`, err);
        }
      }
    }
  }

  async getEventGeneralStats(slug: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug },
      select: {
        registrationCount: true,
        views: true,
        impressions: true,
      },
    });

    if (!event) return null;

    return {
      registrations: event.registrationCount,
      views: event.views.toString(),
      impressions: event.impressions.toString(),
    };
  }

  async getHackathonGeneralStats(slug: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug },
      select: {
        registrationCount: true,
        views: true,
        impressions: true,
      },
    });

    if (!hackathon) return null;

    return {
      registrations: hackathon.registrationCount,
      views: hackathon.views.toString(),
      impressions: hackathon.impressions.toString(),
    };
  }
}
