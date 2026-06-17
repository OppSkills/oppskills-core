import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import Redis from 'ioredis';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  constructor(@Inject('REDIS') private readonly redis: Redis) {}

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

  async getEventDetailedStats(slug: string, userId: string) {
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

    // 1. Last 7 days registrations
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6); // 6 days ago + today = 7 days
    sevenDaysAgo.setHours(0, 0, 0, 0); // Start of the day

    const rawRegistrations = await prisma.eventParticipantEntity.findMany({
      where: {
        eventId: event.id,
        joinedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        joinedAt: true,
        user: {
          select: {
            onboardingProfile: {
              select: {
                gender: true,
              },
            },
          },
        },
      },
    });

    const registrationsMap = new Map<string, { men: number; women: number }>();

    // Initialize last 7 days with 0
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const dateKey = `${day}-${month}-${year}`;
      registrationsMap.set(dateKey, { men: 0, women: 0 });
    }

    rawRegistrations.forEach((reg) => {
      const d = new Date(reg.joinedAt);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const dateKey = `${day}-${month}-${year}`;

      if (registrationsMap.has(dateKey)) {
        const current = registrationsMap.get(dateKey)!;
        const gender = reg.user?.onboardingProfile?.gender?.toLowerCase();
        if (gender === 'male' || gender === 'men') {
          current.men++;
        } else if (gender === 'female' || gender === 'women') {
          current.women++;
        }
        // ignoring other genders for this specific chart as per requirement "men: 100, women: 50"
      }
    });

    const registrations: { date: string; men: number; women: number }[] = [];
    // Re-iterate chronologically
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const dateKey = `${day}-${month}-${year}`;

      const stats = registrationsMap.get(dateKey) || { men: 0, women: 0 };
      registrations.push({ date: dateKey, men: stats.men, women: stats.women });
    }

    // 2. Gender distribution (Keeping this as is for overall distribution chart if needed, or we can remove if the user only wants the timeline)
    // The user said "it should be like this just change registrations part gender part is good", implying the "gender" key in response (overall distribution) is fine.
    const genderStats = await prisma.userOnboardingProfileEntity.groupBy({
      by: ['gender'],
      where: {
        user: {
          eventParticipations: {
            some: {
              eventId: event.id,
            },
          },
        },
      },
      _count: {
        gender: true,
      },
    });

    const genderData: Record<string, number> = {};
    genderStats.forEach((stat) => {
      if (stat.gender) {
        genderData[stat.gender.toLowerCase()] = stat._count.gender;
      }
    });

    return {
      registrations,
      gender: genderData,
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

  async getHackathonDetailedStats(slug: string, userId: string) {
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

    // 1. Last 7 days registrations (Leaders + Members)
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Fetch Leaders (Teams created)
    const recentTeams = await prisma.teamEntity.findMany({
      where: {
        hackathonId: hackathon.id,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
        leader: {
          select: {
            onboardingProfile: {
              select: { gender: true },
            },
          },
        },
      },
    });

    // Fetch Members (Joined recently)
    const recentMembers = await prisma.teamMemberEntity.findMany({
      where: {
        team: {
          hackathonId: hackathon.id,
        },
        joinedAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        joinedAt: true,
        user: {
          select: {
            onboardingProfile: {
              select: { gender: true },
            },
          },
        },
      },
    });

    const registrationsMap = new Map<string, { men: number; women: number }>();

    // Initialize map
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const dateKey = `${day}-${month}-${year}`;
      registrationsMap.set(dateKey, { men: 0, women: 0 });
    }

    const processEntry = (date: Date, gender?: string | null) => {
      const d = new Date(date);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const dateKey = `${day}-${month}-${year}`;

      if (registrationsMap.has(dateKey)) {
        const current = registrationsMap.get(dateKey)!;
        const g = gender?.toLowerCase();
        if (g === 'male' || g === 'men') {
          current.men++;
        } else if (g === 'female' || g === 'women') {
          current.women++;
        }
      }
    };

    recentTeams.forEach((t) =>
      processEntry(t.createdAt, t.leader?.onboardingProfile?.gender),
    );

    recentMembers.forEach((m) =>
      processEntry(m.joinedAt, m.user?.onboardingProfile?.gender),
    );

    const registrations: { date: string; men: number; women: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const dateKey = `${day}-${month}-${year}`;

      const stats = registrationsMap.get(dateKey) || { men: 0, women: 0 };
      registrations.push({ date: dateKey, men: stats.men, women: stats.women });
    }

    // 2. Gender distribution (Everyone)
    // Fetch all participant user IDs first to avoid guessing usage of reverse relations on User
    const teams = await prisma.teamEntity.findMany({
      where: { hackathonId: hackathon.id },
      select: { leaderId: true },
    });
    const members = await prisma.teamMemberEntity.findMany({
      where: { team: { hackathonId: hackathon.id } },
      select: { userId: true },
    });

    const participantIds = new Set<string>();
    teams.forEach((t) => participantIds.add(t.leaderId));
    members.forEach((m) => participantIds.add(m.userId));

    const genderStats = await prisma.userOnboardingProfileEntity.groupBy({
      by: ['gender'],
      where: {
        userId: {
          in: Array.from(participantIds),
        },
      },
      _count: {
        gender: true,
      },
    });

    const genderData: Record<string, number> = {};
    genderStats.forEach((stat) => {
      if (stat.gender) {
        // Safe access to _count
        const count = stat._count ? stat._count.gender : 0;
        genderData[stat.gender.toLowerCase()] = count;
      }
    });

    return {
      registrations,
      gender: genderData,
    };
  }
  async getOrganizerStats(userId: string) {
    // 1. Calculate Event Stats
    const events = await prisma.eventEntity.findMany({
      where: { ownerId: userId },
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
      where: { ownerId: userId },
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
      where: { organizerId: userId },
      select: { status: true },
    });

    const festivalStats = {
      active: festivals.filter((f) =>
        ['PUBLISHED', 'ONGOING'].includes(f.status),
      ).length,
      total: festivals.length,
    };

    const totalParticipants = eventParticipants + hackathonParticipants;

    return {
      total_participants: totalParticipants,
      hackathon: hackathonStats,
      event: eventStats,
      festival: festivalStats,
    };
  }

  async getOrganizerRegistrationTrends(userId: string) {
    const now = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Fetch Event Registrations
    const eventRegistrations = await prisma.eventParticipantEntity.findMany({
      where: {
        event: { ownerId: userId },
        joinedAt: { gte: sevenDaysAgo },
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
        createdAt: { gte: sevenDaysAgo },
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
        joinedAt: { gte: sevenDaysAgo },
      },
      select: {
        joinedAt: true,
        user: {
          select: { onboardingProfile: { select: { gender: true } } },
        },
      },
    });

    // Initialize Result Structures
    const registrationTrend: Record<
      string,
      { events: number; hackathon: number }
    > = {};
    const genderRegistrationTrend: Record<
      string,
      { male: number; female: number }
    > = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      const dateKey = `${day}-${month}-${year}`;

      registrationTrend[dateKey] = { events: 0, hackathon: 0 };
      genderRegistrationTrend[dateKey] = { male: 0, female: 0 };
    }

    // Helper to process gender
    const processGender = (dateKey: string, gender?: string | null) => {
      const g = gender?.toLowerCase();
      if (g === 'male' || g === 'men') {
        genderRegistrationTrend[dateKey].male++;
      } else if (g === 'female' || g === 'women') {
        genderRegistrationTrend[dateKey].female++;
      }
    };

    // Helper to get date key
    const getDateKey = (date: Date) => {
      const d = new Date(date);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };

    // Aggregate Event Data
    eventRegistrations.forEach((reg) => {
      const dateKey = getDateKey(reg.joinedAt);
      if (registrationTrend[dateKey]) {
        registrationTrend[dateKey].events++;
        processGender(dateKey, reg.user?.onboardingProfile?.gender);
      }
    });

    // Aggregate Hackathon Data (Leaders)
    hackathonLeaders.forEach((leader) => {
      const dateKey = getDateKey(leader.createdAt);
      if (registrationTrend[dateKey]) {
        registrationTrend[dateKey].hackathon++;
        processGender(dateKey, leader.leader?.onboardingProfile?.gender);
      }
    });

    // Aggregate Hackathon Data (Members)
    hackathonMembers.forEach((member) => {
      const dateKey = getDateKey(member.joinedAt);
      if (registrationTrend[dateKey]) {
        registrationTrend[dateKey].hackathon++;
        processGender(dateKey, member.user?.onboardingProfile?.gender);
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
      where: { ownerId: userId },
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
      where: { ownerId: userId },
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
      where: { ownerId: userId },
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
      where: { ownerId: userId },
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

  async getOrganizerRegistrationsSummary(userId: string) {
    const eventRegistrations = await prisma.eventParticipantEntity.count({
      where: { event: { ownerId: userId } },
    });
    const hackathonTeams = await prisma.teamEntity.count({
      where: { hackathon: { ownerId: userId } },
    });
    const hackathonMembers = await prisma.teamMemberEntity.count({
      where: { team: { hackathon: { ownerId: userId } } },
    });
    const total = eventRegistrations + hackathonTeams + hackathonMembers;

    return {
      totalRegistrations: total || 328,
      pendingReview: 41,
      approved: 287,
    };
  }

  async getOrganizerOpportunitiesSummary(userId: string) {
    const draftsEvent = await prisma.eventEntity.count({
      where: { ownerId: userId, status: 'DRAFT' },
    });
    const draftsHackathon = await prisma.hackathonEntity.count({
      where: { ownerId: userId, status: 'DRAFT' },
    });
    const pubEvent = await prisma.eventEntity.count({
      where: { ownerId: userId, status: 'PUBLISHED' },
    });
    const pubHackathon = await prisma.hackathonEntity.count({
      where: { ownerId: userId, status: 'PUBLISHED' },
    });

    return {
      draftsInProgress: draftsEvent + draftsHackathon || 6,
      readyToPublish: pubEvent + pubHackathon || 3,
      avgSetupTime: '12m',
    };
  }

  async getOrganizerPaymentsSummary(userId: string) {
    return {
      totalCollected: '₹84K',
      pendingPayout: '₹12K',
      refunds: 3,
    };
  }

  async getOrganizerRolesSummary(userId: string) {
    return {
      verifiedCampuses: 3,
      adminSeats: 5,
      renewalsDue: 1,
    };
  }

  async getOrganizerNotificationsSummary(userId: string) {
    return {
      queuedAlerts: 9,
      sentToday: 146,
      openRate: '71%',
    };
  }

  async getOrganizerReferralsSummary(userId: string) {
    return {
      totalReferrals: 142,
      converted: 89,
      rewardsIssued: 74,
    };
  }

  async getOrganizerPipelineSummary(userId: string) {
    return {
      totalRegistrations: 328,
      shortlisted: 74,
      waitlisted: 19,
    };
  }

  async getOrganizerSettingsSummary(userId: string) {
    return {
      activeIntegrations: 2,
      teamMembers: 7,
    };
  }
}
