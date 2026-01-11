import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
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
        // Atomic GET and DEL to prevent race condition
        // If a new increment comes during this op, Redis blocks effectively,
        // or if it comes after, it creates a new key (safe).
        const value = await this.redis.eval(
          "local v = redis.call('GET', KEYS[1]); redis.call('DEL', KEYS[1]); return v",
          1,
          key,
        );

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
        } catch (err) {
          this.logger.error(`Failed flushing ${key}`, err);
          // If update failed, we might want to put the count back? 
          // For now, logging is safer than risking infinite loops or double counting.
          // In a high-integrity system, we might push back to Redis or a dead-letter queue.
        }
      }
    }
  }

  async getEventGeneralStats(slug: string, userId: string) {
    const event = await prisma.eventEntity.findUnique({
      where: { slug },
      include: {
        userRoles: {
          where: { userId, role: 'MANAGER' },
        },
      },
    });

    if (!event) return null;

    // Security check: Owner OR Manager
    if (event.ownerId !== userId && event.userRoles.length === 0) {
      throw new ForbiddenException(
        'You are not allowed to view analytics for this event.',
      );
    }

    return {
      registrations: event.registrationCount,
      views: event.views.toString(),
      impressions: event.impressions.toString(),
    };
  }

  async getHackathonGeneralStats(slug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug },
      include: {
        userRoles: {
          where: { userId, role: 'MANAGER' },
        },
      },
    });

    if (!hackathon) return null;

    // Security check: Owner OR Manager
    if (hackathon.ownerId !== userId && hackathon.userRoles.length === 0) {
      throw new ForbiddenException(
        'You are not allowed to view analytics for this hackathon.',
      );
    }

    return {
      registrations: hackathon.registrationCount,
      views: hackathon.views.toString(),
      impressions: hackathon.impressions.toString(),
    };
  }
}
