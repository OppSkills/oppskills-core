import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import type Redis from 'ioredis';
import { CacheService } from 'src/common/cache.service';
import type {
  OrganizerRegistrationsSummaryDto,
  OrganizerOpportunitiesSummaryDto,
  OrganizerPaymentsSummaryDto,
  OrganizerRolesSummaryDto,
  OrganizerNotificationsSummaryDto,
  OrganizerReferralsSummaryDto,
  OrganizerPipelineSummaryDto,
  OrganizerSettingsSummaryDto,
} from '@oppskills/types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly redis: Redis;

  constructor(cacheService: CacheService) {
    this.redis = cacheService.getClient();
  }

  private async resolveRange(options: {
    period?: string;
    from?: string;
    to?: string;
    slug?: string;
    type?: 'event' | 'hackathon';
  }) {
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

    const data: {
      [key: string]: { men: number; women: number; other: number };
    } = {};
    const current = new Date(startDate);
    current.setUTCHours(0, 0, 0, 0);

    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setUTCHours(23, 59, 59, 999);

    const bucketBoundaries: { key: string; start: number }[] = [];

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
    items.forEach((item) => {
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

    return bucketBoundaries.map((b) => ({
      date: b.key,
      men: data[b.key].men,
      women: data[b.key].women,
      other: data[b.key].other,
    }));
  }

  private formatDate(d: Date): string {
    const day = d.getUTCDate().toString().padStart(2, '0');
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = d.getUTCFullYear();
    return `${day}-${month}-${year}`;
  }

  async trackPageView(type: 'event' | 'opportunity', slug: string) {
    this.redis.incr(`pv:${type}:${slug}`).catch(() => {});
  }

  async trackPostImpression(type: 'event' | 'opportunity', slug: string) {
    this.redis.incr(`pi:${type}:${slug}`).catch(() => {});
  }

  async flushToDb() {
    const stream = this.redis.scanStream({
      match: '*:*:*', // matches pv:*:* and pi:*:*
      count: 200,
    });

    for await (const keys of stream) {
      await Promise.all(
        keys.map(async (key) => {
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
          const [metric, type, slug] = key.split(':');

          try {
            if (type === 'event') {
              await prisma.eventEntity.update({
                where: { slug },
                data: {
                  ...(metric === 'pv' && { views: { increment: count } }),
                  ...(metric === 'pi' && {
                    impressions: { increment: count },
                  }),
                },
              });
            }

            if (type === 'opportunity') {
              await prisma.hackathonEntity.update({
                where: { slug },
                data: {
                  ...(metric === 'pv' && { views: { increment: count } }),
                  ...(metric === 'pi' && {
                    impressions: { increment: count },
                  }),
                },
              });
            }
          } catch (err) {
            this.logger.error(`Failed flushing ${key}`, err);
          }
        }),
      );
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
      },
    });

    if (!event) return null;

    const { startDate, endDate } = await this.resolveRange({
      ...options,
      slug,
      type: 'event',
    });

    // Period-specific registrations
    const periodRegistrations = await prisma.eventParticipantEntity.count({
      where: {
        event: { slug },
        joinedAt: { gte: startDate, lte: endDate },
      },
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

    const { startDate, endDate } = await this.resolveRange({
      ...options,
      slug,
      type: 'event',
    });

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
            onboardingProfile: { select: { gender: true } },
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const registrationsTrend = this.processTrendData(
      rawRegistrations.map((r) => ({
        joinedAt: r.joinedAt,
        gender: r.user.onboardingProfile?.gender ?? undefined,
      })),
      startDate,
      endDate,
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
              joinedAt: { gte: startDate, lte: endDate },
            },
          },
        },
      },
    });

    const gender = {
      male: genderStats.find((g) => g.gender === 'MALE')?._count.gender || 0,
      female:
        genderStats.find((g) => g.gender === 'FEMALE')?._count.gender || 0,
      other:
        genderStats.find(
          (g) => g.gender === 'OTHER' || g.gender === 'PREFER_NOT_TO_SAY',
        )?._count.gender || 0,
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
      },
    });

    if (!hackathon) return null;

    const { startDate, endDate } = await this.resolveRange({
      ...options,
      slug,
      type: 'hackathon',
    });

    // Period-specific registrations (Teams and Members)
    const [teamLeaderCount, teamMemberCount] = await Promise.all([
      prisma.teamEntity.count({
        where: {
          hackathon: { slug },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.teamMemberEntity.count({
        where: {
          team: { hackathon: { slug } },
          joinedAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

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

    const { startDate, endDate } = await this.resolveRange({
      ...options,
      slug,
      type: 'hackathon',
    });

    // Fetch real registrations (Combined leader creation and member joining)
    const [leaders, members] = await Promise.all([
      prisma.teamEntity.findMany({
        where: {
          hackathon: { slug },
          createdAt: { gte: startDate, lte: endDate },
        },
        select: {
          createdAt: true,
          leader: {
            select: { onboardingProfile: { select: { gender: true } } },
          },
        },
      }),
      prisma.teamMemberEntity.findMany({
        where: {
          team: { hackathon: { slug } },
          joinedAt: { gte: startDate, lte: endDate },
        },
        select: {
          joinedAt: true,
          user: {
            select: { onboardingProfile: { select: { gender: true } } },
          },
        },
      }),
    ]);

    const combinedItems = [
      ...leaders.map((l) => ({
        joinedAt: l.createdAt,
        gender: l.leader.onboardingProfile?.gender ?? undefined,
      })),
      ...members.map((m) => ({
        joinedAt: m.joinedAt,
        gender: m.user.onboardingProfile?.gender ?? undefined,
      })),
    ].sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime());

    const registrationsTrend = this.processTrendData(
      combinedItems,
      startDate,
      endDate,
    );

    // Fetch real gender stats
    const genderStats = await prisma.userOnboardingProfileEntity.groupBy({
      by: ['gender'],
      _count: { gender: true },
      where: {
        user: {
          OR: [
            {
              teamsLed: {
                some: {
                  hackathon: { slug },
                  createdAt: { gte: startDate, lte: endDate },
                },
              },
            },
            {
              teamMembers: {
                some: {
                  team: { hackathon: { slug } },
                  joinedAt: { gte: startDate, lte: endDate },
                },
              },
            },
          ],
        },
      },
    });

    const gender = {
      male: genderStats.find((g) => g.gender === 'MALE')?._count.gender || 0,
      female:
        genderStats.find((g) => g.gender === 'FEMALE')?._count.gender || 0,
      other:
        genderStats.find(
          (g) => g.gender === 'OTHER' || g.gender === 'PREFER_NOT_TO_SAY',
        )?._count.gender || 0,
    };

    return {
      registrations: registrationsTrend,
      gender,
    };
  }
  async getOrganizerStats(
    userId: string,
    options: { period?: string; from?: string; to?: string } = {},
  ) {
    const [events, hackathons, festivals] = await Promise.all([
      prisma.eventEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
        select: {
          id: true,
          status: true,
          views: true,
          impressions: true,
          createdAt: true,
          registrationCount: true,
          _count: {
            select: { participants: true },
          },
        },
      }),
      prisma.hackathonEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
        select: {
          id: true,
          status: true,
          views: true,
          impressions: true,
          createdAt: true,
          _count: {
            select: {
              teams: true,
            },
          },
          registrationCount: true,
        },
      }),
      prisma.festivalEntity.findMany({
        where: { organizerId: userId, isDeleted: false },
        select: { status: true },
      }),
    ]);

    const eventStats = {
      active: events.filter((e) => ['PUBLISHED', 'ONGOING'].includes(e.status))
        .length,
      total: events.length,
    };

    const eventParticipants = events.reduce(
      (acc, e) => acc + (e.registrationCount || 0),
      0,
    );

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

    const festivalStats = {
      active: festivals.filter((f) =>
        ['PUBLISHED', 'ONGOING'].includes(f.status),
      ).length,
      total: festivals.length,
    };

    // 4. Calculate Period Stats
    const { startDate, endDate } = await this.resolveRange(options);

    const [
      periodEventParticipants,
      periodHackathonLeaders,
      periodHackathonMembers,
    ] = await Promise.all([
      prisma.eventParticipantEntity.count({
        where: {
          event: {
            OR: [
              { ownerId: userId },
              { userRoles: { some: { userId, role: 'MANAGER' } } },
            ],
          },
          joinedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.teamEntity.count({
        where: {
          hackathon: {
            OR: [
              { ownerId: userId },
              { userRoles: { some: { userId, role: 'MANAGER' } } },
            ],
          },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.teamMemberEntity.count({
        where: {
          team: {
            hackathon: {
              OR: [
                { ownerId: userId },
                { userRoles: { some: { userId, role: 'MANAGER' } } },
              ],
            },
          },
          joinedAt: { gte: startDate, lte: endDate },
        },
      }),
    ]);

    // 5. Calculate View, Impression and Period Stats in a single pass
    let totalViews = 0;
    let totalImpressions = 0;
    let periodViews = 0;
    let periodImpressions = 0;
    let periodEventsCount = 0;
    let periodHackathonsCount = 0;

    for (const e of events) {
      const v = Number(e.views) || 0;
      const i = Number(e.impressions) || 0;
      totalViews += v;
      totalImpressions += i;

      if (e.createdAt >= startDate && e.createdAt <= endDate) {
        periodEventsCount++;
        periodViews += v;
        periodImpressions += i;
      }
    }

    for (const h of hackathons) {
      const v = Number(h.views) || 0;
      const i = Number(h.impressions) || 0;
      totalViews += v;
      totalImpressions += i;

      if (h.createdAt >= startDate && h.createdAt <= endDate) {
        periodHackathonsCount++;
        periodViews += v;
        periodImpressions += i;
      }
    }

    const totalParticipants = eventParticipants + hackathonParticipants;
    const periodParticipants =
      periodEventParticipants + periodHackathonLeaders + periodHackathonMembers;

    const totalOpportunities = events.length + hackathons.length;
    const periodOpportunities = periodEventsCount + periodHackathonsCount;

    return {
      total_participants: totalParticipants,
      period_participants: periodParticipants,
      total_opportunities: totalOpportunities,
      period_opportunities: periodOpportunities,
      total_views: totalViews,
      period_views: periodViews,
      total_impressions: totalImpressions,
      period_impressions: periodImpressions,
      hackathon: hackathonStats,
      event: eventStats,
      festival: festivalStats,
    };
  }

  async getOrganizerRegistrationTrends(
    userId: string,
    options: { period?: string; from?: string; to?: string } = {},
  ) {
    const { startDate, endDate } = await this.resolveRange(options);

    const [eventRegistrations, hackathonLeaders, hackathonMembers] =
      await Promise.all([
        prisma.eventParticipantEntity.findMany({
          where: {
            event: {
              OR: [
                { ownerId: userId },
                { userRoles: { some: { userId, role: 'MANAGER' } } },
              ],
            },
            joinedAt: { gte: startDate, lte: endDate },
          },
          select: {
            joinedAt: true,
            user: {
              select: { onboardingProfile: { select: { gender: true } } },
            },
          },
        }),
        prisma.teamEntity.findMany({
          where: {
            hackathon: {
              OR: [
                { ownerId: userId },
                { userRoles: { some: { userId, role: 'MANAGER' } } },
              ],
            },
            createdAt: { gte: startDate, lte: endDate },
          },
          select: {
            createdAt: true,
            leader: {
              select: { onboardingProfile: { select: { gender: true } } },
            },
          },
        }),
        prisma.teamMemberEntity.findMany({
          where: {
            team: {
              hackathon: {
                OR: [
                  { ownerId: userId },
                  { userRoles: { some: { userId, role: 'MANAGER' } } },
                ],
              },
            },
            joinedAt: { gte: startDate, lte: endDate },
          },
          select: {
            joinedAt: true,
            user: {
              select: { onboardingProfile: { select: { gender: true } } },
            },
          },
        }),
      ]);

    // Bucketing logic
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let mode: 'day' | 'month' | 'five_day' = 'day';
    if (diffDays > 365) {
      mode = 'month';
    } else if (diffDays > 30) {
      mode = 'five_day';
    }

    const registrationTrend: Record<
      string,
      { events: number; hackathon: number }
    > = {};
    const genderRegistrationTrend: Record<
      string,
      { male: number; female: number }
    > = {};
    const bucketBoundaries: { key: string; start: number }[] = [];

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
    const [topEvents, topHackathons] = await Promise.all([
      prisma.eventEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          bannerImageUrl: true,
          organizationName: true,
          locationCoords: true,
          registrationCount: true,
          participants: {
            where: { approved: true },
            select: { id: true },
          },
        },
        orderBy: {
          participants: {
            _count: 'desc',
          },
        },
        take: 3,
      }),
      prisma.hackathonEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          bannerImageUrl: true,
          organizationName: true,
          locationCoords: true,
          registrationCount: true,
          teams: {
            select: { id: true },
          },
        },
        orderBy: {
          registrationCount: 'desc',
        },
        take: 3,
      }),
    ]);

    const stripHtml = (html: string | null) => {
      if (!html) return '';
      // Simple regex to strip HTML tags
      const text = html.replace(/<[^>]*>?/gm, '');
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    };

    const formattedEvents = topEvents.map((e) => ({
      title: e.name,
      slug: e.slug,
      thumbnail: e.bannerImageUrl,
      description: stripHtml(e.description),
      organization: e.organizationName || 'OppSkills',
      location: e.locationCoords || 'Remote',
      applied: e.registrationCount ?? 0,
      tregistrations: e.registrationCount ?? 0,
      finalized: e.participants?.length ?? 0,
      type: 'EVENT',
    }));

    const formattedHackathons = topHackathons.map((h) => ({
      title: h.name,
      slug: h.slug,
      thumbnail: h.bannerImageUrl,
      description: stripHtml(h.description),
      organization: h.organizationName || 'OppSkills',
      location: h.locationCoords || 'Remote',
      applied: h.registrationCount ?? 0,
      tregistrations: h.registrationCount ?? 0,
      finalized: h.registrationCount ?? 0, // For hackathons, Applied = Finalized as requested
      type: 'HACKATHON',
    }));

    // Combine and Sort
    const allListings = [...formattedEvents, ...formattedHackathons];
    allListings.sort((a, b) => b.applied - a.applied);

    return allListings.slice(0, 3);
  }

  async getHighestPerformingListings(userId: string) {
    const [topEvent, topHackathon] = await Promise.all([
      prisma.eventEntity.findFirst({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
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
      }),
      prisma.hackathonEntity.findFirst({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
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
      }),
    ]);

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

  private async getOrganizerOpportunitiesIds(userId: string) {
    const [events, hackathons] = await Promise.all([
      prisma.eventEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
        select: { id: true },
      }),
      prisma.hackathonEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
        select: { id: true },
      }),
    ]);

    return {
      eventIds: events.map((e) => e.id),
      hackathonIds: hackathons.map((h) => h.id),
    };
  }

  async getRegistrationsSummary(
    userId: string,
  ): Promise<OrganizerRegistrationsSummaryDto> {
    const { eventIds, hackathonIds } =
      await this.getOrganizerOpportunitiesIds(userId);

    const [eventParticipants, hackathonRegsCount] = await Promise.all([
      prisma.eventParticipantEntity.findMany({
        where: {
          eventId: { in: eventIds },
          checkoutPending: false,
        },
        select: {
          approved: true,
        },
      }),
      prisma.hackathonRegistrationSubmissionEntity.count({
        where: {
          hackathonId: { in: hackathonIds },
        },
      }),
    ]);

    let approved = eventParticipants.filter((p) => p.approved).length;
    const pendingReview = eventParticipants.filter((p) => !p.approved).length;

    // Treat hackathon submissions as approved registrations
    approved += hackathonRegsCount;
    const totalRegistrations = approved + pendingReview;

    return {
      totalRegistrations,
      pendingReview,
      approved,
    };
  }

  async getOpportunitiesSummary(
    userId: string,
  ): Promise<OrganizerOpportunitiesSummaryDto> {
    const [events, hackathons] = await Promise.all([
      prisma.eventEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
        select: {
          status: true,
          createdAt: true,
          approvalApprovedAt: true,
        },
      }),
      prisma.hackathonEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
          isDeleted: false,
        },
        select: {
          status: true,
          createdAt: true,
          approvalApprovedAt: true,
        },
      }),
    ]);

    const allOpportunities = [...events, ...hackathons];

    const draftsInProgress = allOpportunities.filter(
      (o) => o.status === 'DRAFT',
    ).length;
    const readyToPublish = allOpportunities.filter((o) =>
      ['PUBLISHED', 'ONGOING'].includes(o.status),
    ).length;

    let totalSetupTimeMs = 0;
    let approvedCount = 0;

    for (const o of allOpportunities) {
      if (o.approvalApprovedAt) {
        totalSetupTimeMs +=
          o.approvalApprovedAt.getTime() - o.createdAt.getTime();
        approvedCount++;
      }
    }

    let avgSetupTime = '0 hours';
    if (approvedCount > 0) {
      const avgMs = totalSetupTimeMs / approvedCount;
      const avgDays = avgMs / (1000 * 60 * 60 * 24);
      if (avgDays >= 1) {
        avgSetupTime = `${avgDays.toFixed(1)} days`;
      } else {
        const avgHours = avgMs / (1000 * 60 * 60);
        avgSetupTime = `${avgHours.toFixed(1)} hours`;
      }
    }

    return {
      draftsInProgress,
      readyToPublish,
      avgSetupTime,
    };
  }

  async getPaymentsSummary(
    userId: string,
  ): Promise<OrganizerPaymentsSummaryDto> {
    const [eventPayments, hackathonPayments] = await Promise.all([
      prisma.eventPaymentEntity.findMany({
        where: {
          event: {
            OR: [
              { ownerId: userId },
              { userRoles: { some: { userId, role: 'MANAGER' } } },
            ],
            isDeleted: false,
          },
        },
        select: {
          grossAmount: true,
          organizerShareAmount: true,
          paymentStatus: true,
          transferStatus: true,
          transferOnHold: true,
          refundedAmount: true,
        },
      }),
      prisma.hackathonPaymentEntity.findMany({
        where: {
          hackathon: {
            OR: [
              { ownerId: userId },
              { userRoles: { some: { userId, role: 'MANAGER' } } },
            ],
            isDeleted: false,
          },
        },
        select: {
          grossAmount: true,
          organizerShareAmount: true,
          paymentStatus: true,
          transferStatus: true,
          transferOnHold: true,
          refundedAmount: true,
        },
      }),
    ]);

    let totalCollected = 0;
    let pendingPayout = 0;
    let refunds = 0;

    const allPayments = [...eventPayments, ...hackathonPayments];

    for (const p of allPayments) {
      const gross = Number(p.grossAmount) || 0;
      const orgShare = Number(p.organizerShareAmount) || 0;
      const refAmt = Number(p.refundedAmount) || 0;

      if (p.paymentStatus === 'CAPTURED') {
        totalCollected += gross;

        if (p.transferStatus !== 'PAID' || p.transferOnHold) {
          pendingPayout += orgShare;
        }
      }

      if (p.paymentStatus === 'REFUNDED' || refAmt > 0) {
        refunds += refAmt || gross;
      }
    }

    return {
      totalCollected,
      pendingPayout,
      refunds,
    };
  }

  async getRolesSummary(userId: string): Promise<OrganizerRolesSummaryDto> {
    const { eventIds, hackathonIds } =
      await this.getOrganizerOpportunitiesIds(userId);

    const [eventUserIds, hackathonUserIds] = await Promise.all([
      prisma.eventParticipantEntity.findMany({
        where: { eventId: { in: eventIds } },
        select: { userId: true },
      }),
      prisma.hackathonRegistrationSubmissionEntity.findMany({
        where: { hackathonId: { in: hackathonIds } },
        select: { userId: true },
      }),
    ]);

    const distinctUserIds = Array.from(
      new Set([
        ...eventUserIds.map((p) => p.userId),
        ...hackathonUserIds.map((s) => s.userId),
      ]),
    );

    const [campuses, hackathonRolesCount, eventRolesCount] = await Promise.all([
      prisma.userOnboardingProfileEntity.findMany({
        where: {
          userId: { in: distinctUserIds },
          collegeId: { not: null },
        },
        select: { collegeId: true },
        distinct: ['collegeId'],
      }),
      prisma.hackathonUserRoleEntity.count({
        where: { hackathonId: { in: hackathonIds } },
      }),
      prisma.eventUserRoleEntity.count({
        where: { eventId: { in: eventIds } },
      }),
    ]);

    return {
      verifiedCampuses: campuses.length,
      adminSeats: hackathonRolesCount + eventRolesCount,
      renewalsDue: 0,
    };
  }

  async getNotificationsSummary(
    userId: string,
  ): Promise<OrganizerNotificationsSummaryDto> {
    const { eventIds, hackathonIds } =
      await this.getOrganizerOpportunitiesIds(userId);

    const queuedAlerts = await prisma.notifications.count({
      where: {
        status: { in: ['QUEUED', 'PROCESSING'] },
        OR: [
          { eventId: { in: eventIds } },
          { hackathonId: { in: hackathonIds } },
        ],
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const notificationsSentToday = await prisma.notifications.findMany({
      where: {
        completedAt: { gte: todayStart },
        OR: [
          { eventId: { in: eventIds } },
          { hackathonId: { in: hackathonIds } },
        ],
      },
      select: {
        successCount: true,
      },
    });

    const sentToday = notificationsSentToday.reduce(
      (sum, n) => sum + (n.successCount || 0),
      0,
    );

    return {
      queuedAlerts,
      sentToday,
      openRate: 0.0,
    };
  }

  async getReferralsSummary(
    userId: string,
  ): Promise<OrganizerReferralsSummaryDto> {
    const { eventIds, hackathonIds } =
      await this.getOrganizerOpportunitiesIds(userId);

    const referrals = await prisma.referralEntity.findMany({
      where: {
        OR: [
          {
            entityType: 'EVENT',
            entityId: { in: eventIds },
          },
          {
            entityType: 'HACKATHON',
            entityId: { in: hackathonIds },
          },
        ],
      },
      select: {
        registrationsCount: true,
      },
    });

    const totalReferrals = referrals.length;
    const converted = referrals.reduce(
      (sum, r) => sum + (r.registrationsCount || 0),
      0,
    );

    return {
      totalReferrals,
      converted,
      rewardsIssued: 0,
    };
  }

  async getPipelineSummary(
    userId: string,
  ): Promise<OrganizerPipelineSummaryDto> {
    const [regSummary, { shortlisted }] = await Promise.all([
      this.getRegistrationsSummary(userId),
      this.getOrganizerOpportunitiesIds(userId).then(
        async ({ hackathonIds }) => ({
          shortlisted: await prisma.teamRoundQualificationEntity.count({
            where: {
              qualified: true,
              round: {
                hackathonId: { in: hackathonIds },
              },
            },
          }),
        }),
      ),
    ]);

    return {
      totalRegistrations: regSummary.totalRegistrations,
      shortlisted,
      waitlisted: 0,
    };
  }

  async getSettingsSummary(
    userId: string,
  ): Promise<OrganizerSettingsSummaryDto> {
    const { eventIds, hackathonIds } =
      await this.getOrganizerOpportunitiesIds(userId);

    const hasGoogleSheets = !!(
      process.env.GOOGLE_SHEETS_CLIENT_EMAIL &&
      process.env.GOOGLE_SHEETS_PRIVATE_KEY &&
      process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    );

    const [activeRazorpay, hackathonRoles, eventRoles] = await Promise.all([
      prisma.razorpayRouteAccountEntity.count({
        where: {
          userId,
          status: 'ACTIVATED',
        },
      }),
      prisma.hackathonUserRoleEntity.findMany({
        where: { hackathonId: { in: hackathonIds } },
        select: { userId: true },
      }),
      prisma.eventUserRoleEntity.findMany({
        where: { eventId: { in: eventIds } },
        select: { userId: true },
      }),
    ]);

    const activeIntegrations = activeRazorpay + (hasGoogleSheets ? 1 : 0);

    const distinctTeamUserIds = new Set([
      ...hackathonRoles.map((r) => r.userId),
      ...eventRoles.map((r) => r.userId),
    ]);

    distinctTeamUserIds.delete(userId);
    const teamMembers = distinctTeamUserIds.size;

    return {
      activeIntegrations,
      teamMembers,
    };
  }
}
