import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(@Inject('REDIS') private readonly redis: Redis) { }

  private async resolveRange(options: { period?: string; from?: string; to?: string; slug?: string; type?: 'event' | 'hackathon' }) {
    const { period, from, to, slug, type } = options;
    let startDate = new Date();
    let endDate = new Date();

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      const activePeriod = period || 'all_time';
      switch (activePeriod) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'yesterday':
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setDate(endDate.getDate() - 1);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this_month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this_year':
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'all_time':
          if (slug && type === 'event') {
            const oldest = await prisma.eventParticipantEntity.findFirst({
              where: { event: { slug } },
              orderBy: { joinedAt: 'asc' },
            });
            startDate = oldest?.joinedAt || new Date(2024, 0, 1);
          } else if (slug && type === 'hackathon') {
            const oldest = await prisma.teamMemberEntity.findFirst({
              where: { team: { hackathon: { slug } } },
              orderBy: { joinedAt: 'asc' },
            });
            startDate = oldest?.joinedAt || new Date(2024, 0, 1);
          } else {
            startDate = new Date(2024, 0, 1);
          }
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'this_week':
        default:
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
    }
    return { startDate, endDate };
  }

  private processTrendData(
    items: { joinedAt: Date; gender?: string }[],
    startDate: Date,
    endDate: Date,
  ): { date: string; men: number; women: number; other: number }[] {
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let mode: 'day' | 'month' | 'five_day' = 'day';
    if (diffDays > 365) {
      mode = 'month';
    } else if (diffDays > 30) {
      mode = 'five_day';
    }

    const data: { [key: string]: { men: number; women: number; other: number } } = {};
    const current = new Date(startDate);
    current.setUTCHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setUTCHours(23, 59, 59, 999);

    const bucketBoundaries: { key: string, start: number }[] = [];

    // Initialize buckets and boundaries
    while (current <= normalizedEndDate) {
      const key = this.formatDate(current);
      data[key] = { men: 0, women: 0, other: 0 };
      bucketBoundaries.push({ key, start: current.getTime() });

      if (mode === 'month') {
        current.setUTCMonth(current.getUTCMonth() + 1);
      } else if (mode === 'five_day') {
        current.setUTCDate(current.getUTCDate() + 5);
      } else {
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    // Sort boundaries ascending for binary search or linear scan
    bucketBoundaries.sort((a, b) => a.start - b.start);

    // Fill buckets
    items.forEach(item => {
      const registrationTime = item.joinedAt.getTime();

      // Find the right bucket (last boundary <= registrationTime)
      let assignedKey: string | null = null;
      for (let i = bucketBoundaries.length - 1; i >= 0; i--) {
        if (registrationTime >= bucketBoundaries[i].start) {
          assignedKey = bucketBoundaries[i].key;
          break;
        }
      }

      if (assignedKey && data[assignedKey]) {
        const gender = item.gender;
        if (gender === 'MALE') data[assignedKey].men++;
        else if (gender === 'FEMALE') data[assignedKey].women++;
        else data[assignedKey].other++;
      }
    });

    return bucketBoundaries.map(b => ({
      date: b.key,
      men: data[b.key].men,
      women: data[b.key].women,
      other: data[b.key].other
    }));
  }

  private formatDate(d: Date): string {
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }

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

  async getEventGeneralStats(
    slug: string,
    userId: string,
    options: { period?: string; from?: string; to?: string },
  ) {
    const event = await prisma.eventEntity.findFirst({
      where: {
        slug,
        isDeleted: false,
        OR: [
          { ownerId: userId },
          { userRoles: { some: { userId, role: 'MANAGER' } } },
        ],
      },
      select: {
        views: true,
        impressions: true,
        registrationCount: true,
      }
    });

    if (!event) return null;

    const { startDate, endDate } = await this.resolveRange({ ...options, slug, type: 'event' });

    // Period-specific registrations
    const periodRegistrations = await prisma.eventParticipantEntity.count({
      where: {
        event: { slug },
        joinedAt: { gte: startDate, lte: endDate },
      }
    });

    return {
      registrations: event.registrationCount, // Global total
      periodRegistrations, // Stats for the chosen range
      views: event.views.toString(),
      impressions: event.impressions.toString(),
    };
  }

  async getEventDetailedStats(
    slug: string,
    userId: string,
    options: { period?: string; from?: string; to?: string },
  ) {
    const event = await prisma.eventEntity.findFirst({
      where: {
        slug,
        isDeleted: false,
        OR: [
          { ownerId: userId },
          { userRoles: { some: { userId, role: 'MANAGER' } } },
        ],
      },
    });

    if (!event) return null;

    const { startDate, endDate } = await this.resolveRange({ ...options, slug, type: 'event' });

    // Fetch real registrations
    const rawRegistrations = await prisma.eventParticipantEntity.findMany({
      where: {
        event: { slug },
        joinedAt: { gte: startDate, lte: endDate },
      },
      select: {
        joinedAt: true,
        user: {
          select: {
            onboardingProfile: { select: { gender: true } }
          }
        }
      },
      orderBy: { joinedAt: 'asc' },
    });

    const registrationsTrend = this.processTrendData(
      rawRegistrations.map(r => ({
        joinedAt: r.joinedAt,
        gender: r.user.onboardingProfile?.gender ?? undefined
      })),
      startDate,
      endDate
    );

    // Fetch real gender stats
    const genderStats = await prisma.userOnboardingProfileEntity.groupBy({
      by: ['gender'],
      _count: { gender: true },
      where: {
        user: {
          eventParticipations: {
            some: {
              event: { slug },
              joinedAt: { gte: startDate, lte: endDate }
            }
          }
        }
      }
    });

    const gender = {
      male: genderStats.find(g => g.gender === 'MALE')?._count.gender || 0,
      female: genderStats.find(g => g.gender === 'FEMALE')?._count.gender || 0,
      other: genderStats.find(g => g.gender === 'OTHER' || g.gender === 'PREFER_NOT_TO_SAY')?._count.gender || 0,
    };

    return {
      registrations: registrationsTrend,
      gender,
    };
  }

  async getHackathonGeneralStats(
    slug: string,
    userId: string,
    options: { period?: string; from?: string; to?: string },
  ) {
    const hackathon = await prisma.hackathonEntity.findFirst({
      where: {
        slug,
        isDeleted: false,
        OR: [
          { ownerId: userId },
          { userRoles: { some: { userId, role: 'MANAGER' } } },
        ],
      },
      select: {
        views: true,
        impressions: true,
        registrationCount: true,
      }
    });

    if (!hackathon) return null;

    const { startDate, endDate } = await this.resolveRange({ ...options, slug, type: 'hackathon' });

    // Period-specific registrations (Teams and Members)
    const teamLeaderCount = await prisma.teamEntity.count({
      where: {
        hackathon: { slug },
        createdAt: { gte: startDate, lte: endDate },
      }
    });

    const teamMemberCount = await prisma.teamMemberEntity.count({
      where: {
        team: { hackathon: { slug } },
        joinedAt: { gte: startDate, lte: endDate },
      }
    });

    return {
      registrations: hackathon.registrationCount, // Global total
      periodRegistrations: teamLeaderCount + teamMemberCount,
      views: hackathon.views.toString(),
      impressions: hackathon.impressions.toString(),
    };
  }

  async getHackathonDetailedStats(
    slug: string,
    userId: string,
    options: { period?: string; from?: string; to?: string },
  ) {
    const hackathon = await prisma.hackathonEntity.findFirst({
      where: {
        slug,
        isDeleted: false,
        OR: [
          { ownerId: userId },
          { userRoles: { some: { userId, role: 'MANAGER' } } },
        ],
      },
    });

    if (!hackathon) return null;

    const { startDate, endDate } = await this.resolveRange({ ...options, slug, type: 'hackathon' });

    // Fetch real registrations (Combined leader creation and member joining)
    const leaders = await prisma.teamEntity.findMany({
      where: {
        hackathon: { slug },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        leader: {
          select: { onboardingProfile: { select: { gender: true } } }
        }
      },
    });

    const members = await prisma.teamMemberEntity.findMany({
      where: {
        team: { hackathon: { slug } },
        joinedAt: { gte: startDate, lte: endDate },
      },
      select: {
        joinedAt: true,
        user: {
          select: { onboardingProfile: { select: { gender: true } } }
        }
      },
    });

    const combinedItems = [
      ...leaders.map(l => ({ joinedAt: l.createdAt, gender: l.leader.onboardingProfile?.gender ?? undefined })),
      ...members.map(m => ({ joinedAt: m.joinedAt, gender: m.user.onboardingProfile?.gender ?? undefined }))
    ].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

    const registrationsTrend = this.processTrendData(combinedItems, startDate, endDate);

    // Fetch real gender stats
    const genderStats = await prisma.userOnboardingProfileEntity.groupBy({
      by: ['gender'],
      _count: { gender: true },
      where: {
        user: {
          OR: [
            { teamsLed: { some: { hackathon: { slug }, createdAt: { gte: startDate, lte: endDate } } } },
            { teamMembers: { some: { team: { hackathon: { slug } }, joinedAt: { gte: startDate, lte: endDate } } } }
          ]
        }
      }
    });

    const gender = {
      male: genderStats.find(g => g.gender === 'MALE')?._count.gender || 0,
      female: genderStats.find(g => g.gender === 'FEMALE')?._count.gender || 0,
      other: genderStats.find(g => g.gender === 'OTHER' || g.gender === 'PREFER_NOT_TO_SAY')?._count.gender || 0,
    };

    return {
      registrations: registrationsTrend,
      gender,
    };
  }
  async getOrganizerStats(userId: string, options: { period?: string; from?: string; to?: string } = {}) {
    // 1. Calculate Event Stats
    const events = await prisma.eventEntity.findMany({
      where: { ownerId: userId, isDeleted: false },
      select: {
        id: true,
        status: true,
        _count: {
          select: { participants: true },
        },
      },
    });

    const eventStats = {
      active: events.filter((e) => ['PUBLISHED', 'ONGOING'].includes(e.status))
        .length,
      total: events.length,
    };

    const eventParticipants = events.reduce(
      (acc, e) => acc + (e._count?.participants ?? 0),
      0,
    );

    // 2. Calculate Hackathon Stats
    const hackathons = await prisma.hackathonEntity.findMany({
      where: { ownerId: userId, isDeleted: false },
      select: {
        id: true,
        status: true,
        _count: {
          select: {
            teams: true,
          },
        },
        registrationCount: true,
      },
    });

    const hackathonStats = {
      active: hackathons.filter((h) =>
        ['PUBLISHED', 'ONGOING'].includes(h.status),
      ).length,
      total: hackathons.length,
    };

    const hackathonParticipants = hackathons.reduce(
      (acc, h) => acc + (h.registrationCount || 0),
      0,
    );

    // 3. Calculate Festival Stats
    const festivals = await prisma.festivalEntity.findMany({
      where: { organizerId: userId, isDeleted: false },
      select: { status: true },
    });

    const festivalStats = {
      active: festivals.filter((f) =>
        ['PUBLISHED', 'ONGOING'].includes(f.status),
      ).length,
      total: festivals.length,
    };

    // 4. Calculate Period Stats
    const { startDate, endDate } = await this.resolveRange(options);

    const periodEventParticipants = await prisma.eventParticipantEntity.count({
      where: {
        event: { ownerId: userId },
        joinedAt: { gte: startDate, lte: endDate },
      },
    });

    const periodHackathonLeaders = await prisma.teamEntity.count({
      where: {
        hackathon: { ownerId: userId },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    const periodHackathonMembers = await prisma.teamMemberEntity.count({
      where: {
        team: { hackathon: { ownerId: userId } },
        joinedAt: { gte: startDate, lte: endDate },
      },
    });

    const totalParticipants = eventParticipants + hackathonParticipants;
    const periodParticipants = periodEventParticipants + periodHackathonLeaders + periodHackathonMembers;

    return {
      total_participants: totalParticipants,
      period_participants: periodParticipants,
      hackathon: hackathonStats,
      event: eventStats,
      festival: festivalStats,
    };
  }

  async getOrganizerRegistrationTrends(userId: string, options: { period?: string; from?: string; to?: string } = {}) {
    const { startDate, endDate } = await this.resolveRange(options);

    // 1. Fetch Event Registrations
    const eventRegistrations = await prisma.eventParticipantEntity.findMany({
      where: {
        event: { ownerId: userId },
        joinedAt: { gte: startDate, lte: endDate },
      },
      select: {
        joinedAt: true,
        user: {
          select: { onboardingProfile: { select: { gender: true } } },
        },
      },
    });

    // 2. Fetch Hackathon Registrations (Leaders)
    const hackathonLeaders = await prisma.teamEntity.findMany({
      where: {
        hackathon: { ownerId: userId },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        leader: {
          select: { onboardingProfile: { select: { gender: true } } },
        },
      },
    });

    // 3. Fetch Hackathon Registrations (Members)
    const hackathonMembers = await prisma.teamMemberEntity.findMany({
      where: {
        team: { hackathon: { ownerId: userId } },
        joinedAt: { gte: startDate, lte: endDate },
      },
      select: {
        joinedAt: true,
        user: {
          select: { onboardingProfile: { select: { gender: true } } },
        },
      },
    });

    // Bucketing logic
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let mode: 'day' | 'month' | 'five_day' = 'day';
    if (diffDays > 365) {
      mode = 'month';
    } else if (diffDays > 30) {
      mode = 'five_day';
    }

    const registrationTrend: Record<string, { events: number; hackathon: number }> = {};
    const genderRegistrationTrend: Record<string, { male: number; female: number }> = {};
    const bucketBoundaries: { key: string, start: number }[] = [];

    const current = new Date(startDate);
    current.setUTCHours(0, 0, 0, 0);
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setUTCHours(23, 59, 59, 999);

    while (current <= normalizedEndDate) {
      const key = this.formatDate(current);
      registrationTrend[key] = { events: 0, hackathon: 0 };
      genderRegistrationTrend[key] = { male: 0, female: 0 };
      bucketBoundaries.push({ key, start: current.getTime() });

      if (mode === 'month') {
        current.setUTCMonth(current.getUTCMonth() + 1);
      } else if (mode === 'five_day') {
        current.setUTCDate(current.getUTCDate() + 5);
      } else {
        current.setUTCDate(current.getUTCDate() + 1);
      }
    }

    const getBucketKey = (time: number) => {
      for (let i = bucketBoundaries.length - 1; i >= 0; i--) {
        if (time >= bucketBoundaries[i].start) {
          return bucketBoundaries[i].key;
        }
      }
      return null;
    };

    const processGender = (key: string, gender?: string | null) => {
      if (!key || !genderRegistrationTrend[key]) return;
      const g = gender?.toLowerCase();
      if (g === 'male' || g === 'men') {
        genderRegistrationTrend[key].male++;
      } else if (g === 'female' || g === 'women') {
        genderRegistrationTrend[key].female++;
      }
    };

    // Aggregate Event Data
    eventRegistrations.forEach((reg) => {
      const key = getBucketKey(reg.joinedAt.getTime());
      if (key && registrationTrend[key]) {
        registrationTrend[key].events++;
        processGender(key, reg.user?.onboardingProfile?.gender);
      }
    });

    // Aggregate Hackathon Data (Leaders)
    hackathonLeaders.forEach((leader) => {
      const key = getBucketKey(leader.createdAt.getTime());
      if (key && registrationTrend[key]) {
        registrationTrend[key].hackathon++;
        processGender(key, leader.leader?.onboardingProfile?.gender);
      }
    });

    // Aggregate Hackathon Data (Members)
    hackathonMembers.forEach((member) => {
      const key = getBucketKey(member.joinedAt.getTime());
      if (key && registrationTrend[key]) {
        registrationTrend[key].hackathon++;
        processGender(key, member.user?.onboardingProfile?.gender);
      }
    });

    return {
      registrationTrend,
      genderRegistrationTrend,
    };
  }

  async getTopListings(userId: string) {
    // 1. Fetch Top 3 Events
    const topEvents = await prisma.eventEntity.findMany({
      where: { ownerId: userId, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        bannerImageUrl: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy: {
        participants: {
          _count: 'desc',
        },
      },
      take: 3,
    });

    // 2. Fetch Top 3 Hackathons
    const topHackathons = await prisma.hackathonEntity.findMany({
      where: { ownerId: userId, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        bannerImageUrl: true,
        registrationCount: true,
      },
      orderBy: {
        registrationCount: 'desc',
      },
      take: 3,
    });

    const formattedEvents = topEvents.map((e) => ({
      title: e.name,
      slug: e.slug,
      thumbnail: e.bannerImageUrl,
      tregistrations: e._count?.participants ?? 0,
      type: 'EVENT',
    }));

    const formattedHackathons = topHackathons.map((h) => ({
      title: h.name,
      slug: h.slug,
      thumbnail: h.bannerImageUrl,
      tregistrations: h.registrationCount ?? 0,
      type: 'HACKATHON',
    }));

    // Combine and Sort
    const allListings = [...formattedEvents, ...formattedHackathons];
    allListings.sort((a, b) => b.tregistrations - a.tregistrations);

    return allListings.slice(0, 3);
  }

  async getHighestPerformingListings(userId: string) {
    // 1. Highest Performing Event
    const topEvent = await prisma.eventEntity.findFirst({
      where: { ownerId: userId, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        bannerImageUrl: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy: {
        participants: {
          _count: 'desc',
        },
      },
    });

    // 2. Highest Performing Hackathon
    const topHackathon = await prisma.hackathonEntity.findFirst({
      where: { ownerId: userId, isDeleted: false },
      select: {
        id: true,
        name: true,
        slug: true,
        bannerImageUrl: true,
        registrationCount: true,
      },
      orderBy: {
        registrationCount: 'desc',
      },
    });

    return {
      event: topEvent
        ? {
          title: topEvent.name,
          slug: topEvent.slug,
          thumbnail: topEvent.bannerImageUrl,
          tregistrations: topEvent._count?.participants ?? 0,
        }
        : null,
      hackathon: topHackathon
        ? {
          title: topHackathon.name,
          slug: topHackathon.slug,
          thumbnail: topHackathon.bannerImageUrl,
          tregistrations: topHackathon.registrationCount ?? 0,
        }
        : null,
    };
  }
}
