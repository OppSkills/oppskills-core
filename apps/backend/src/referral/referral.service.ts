import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma, ReferralEntity } from '@oppskills/db';
import {
  CreateReferralDto,
  ListReferralsQueryDto,
  LookupUserDto,
  ReferralAnalyticsDto,
  ReferralEntityTypeDto,
} from '@oppskills/types';
import { randomBytes } from 'crypto';
import { EmailService } from 'src/email/email.service';
import { ReferralAuthzService } from './referral-authz.service';
import { ReferralCounterService } from './referral-counter.service';

const ONBOARDING_PROFILE_SELECT = {
  select: {
    userCategory: true,
    locationCoords: true,
    locationState: true,
    locationCountry: true,
    college: { select: { name: true } },
    schoolName: true,
    companyName: true,
    jobTitle: true,
    course: true,
    courseSpecialization: true,
    collegeCurrentYear: true,
  },
} as const;

@Injectable()
export class ReferralService {
  constructor(
    private readonly authz: ReferralAuthzService,
    private readonly emailService: EmailService,
    private readonly counter: ReferralCounterService,
  ) {}

  private async nextCode(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const code = randomBytes(8).toString('base64url').slice(0, 10);
      const exists = await prisma.referralEntity.findUnique({
        where: { code },
      });
      if (!exists) return code;
    }
    throw new BadRequestException('Failed to generate referral code');
  }

  async lookupUser(dto: LookupUserDto, userId: string) {
    await this.authz.assertCanManageEntity(
      userId,
      dto.entityType,
      dto.entityId,
    );
    const user = await prisma.userEntity.findFirst({
      where: { email: { equals: dto.email.trim(), mode: 'insensitive' } },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
      },
    });
    if (!user) throw new NotFoundException('No user found with this email');
    return user;
  }

  async createReferral(dto: CreateReferralDto, userId: string) {
    await this.authz.assertCanManageEntity(
      userId,
      dto.entityType,
      dto.entityId,
    );
    const referrer = await prisma.userEntity.findFirst({
      where: {
        email: { equals: dto.referrerEmail.trim(), mode: 'insensitive' },
      },
    });
    if (!referrer) {
      throw new NotFoundException('User with this email does not exist');
    }
    if (referrer.id === userId) {
      throw new BadRequestException('Self-referral is not allowed');
    }

    const existing = await prisma.referralEntity.findFirst({
      where: {
        entityType: dto.entityType,
        entityId: dto.entityId,
        referrerId: referrer.id,
        isDeleted: false,
      },
    });
    if (existing) return existing;

    const code = await this.nextCode();
    const referral = await prisma.referralEntity.create({
      data: {
        code,
        entityType: dto.entityType,
        entityId: dto.entityId,
        referrerId: referrer.id,
        createdById: userId,
      },
      include: {
        referrer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    if (dto.sendEmail !== false) {
      const slug = await this.authz.getEntityPublicSlug(
        dto.entityType,
        dto.entityId,
      );
      const creator = await prisma.userEntity.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });
      if (slug) {
        const host = process.env.FRONTEND_URL || 'https://www.oppskills.com';
        const organizerName = [creator?.firstName, creator?.lastName]
          .filter(Boolean)
          .join(' ');
        this.emailService
          .send({
            type: 'referral-invitation',
            to: referrer.email,
            props: {
              firstName: referrer.firstName || undefined,
              entityName: slug,
              entityType: dto.entityType.toLowerCase() as
                | 'hackathon'
                | 'event'
                | 'festival',
              organizerName: organizerName || 'Organizer',
              referralLink: `${host}/r/${code}`,
              baseUrl: host,
            },
          })
          .catch(() => undefined);
      }
    }

    return referral;
  }

  async listReferrals(query: ListReferralsQueryDto, userId: string) {
    await this.authz.assertCanManageEntity(
      userId,
      query.entityType,
      query.entityId,
    );
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const [rows, total] = await Promise.all([
      prisma.referralEntity.findMany({
        where: {
          entityType: query.entityType,
          entityId: query.entityId,
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          referrer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              createdAt: true,
              onboardingProfile: ONBOARDING_PROFILE_SELECT,
            },
          },
        },
      }),
      prisma.referralEntity.count({
        where: {
          entityType: query.entityType,
          entityId: query.entityId,
          isDeleted: false,
        },
      }),
    ]);

    const referralIds = rows.map((r) => r.id);
    const { clicks: clicksRecentMap, registrations: registrationsRecentMap } =
      await this.getRecentStatsBatch(referralIds);

    const withDeltas = rows.map((row) => ({
      ...row,
      referrer: {
        ...row.referrer,
        institution:
          row.referrer.onboardingProfile?.college?.name ||
          row.referrer.onboardingProfile?.schoolName ||
          'N/A',
        location: this.formatLocation(row.referrer.onboardingProfile),
        profession: this.formatProfession(row.referrer.onboardingProfile),
        registrationDate: row.referrer.createdAt,
      },
      clicksRecent: clicksRecentMap[row.id] || 0,
      registrationsRecent: registrationsRecentMap[row.id] || 0,
    }));
    return { data: withDeltas, total, page, pageSize };
  }

  async getReferrerDetailsForOrganizer(referralId: string, userId: string) {
    // 1. Assert rights by fetching the primary referral
    const referral = await this.getReferralById(referralId, userId);

    // 2. Fetch Referrer profile safely
    const referrer = await prisma.userEntity.findUnique({
      where: { id: referral.referrerId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        imageUrl: true,
        createdAt: true,
        onboardingProfile: ONBOARDING_PROFILE_SELECT,
      },
    });
    if (!referrer) throw new NotFoundException('Referrer not found');

    // 3. Find all entities this organizer manages
    const [myHackathons, myEvents, myFestivals] = await Promise.all([
      prisma.hackathonEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
        },
        select: { id: true, slug: true, name: true, bannerImageUrl: true },
      }),
      prisma.eventEntity.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { userRoles: { some: { userId, role: 'MANAGER' } } },
          ],
        },
        select: { id: true, slug: true, name: true, bannerImageUrl: true },
      }),
      prisma.festivalEntity.findMany({
        where: { organizerId: userId },
        select: { id: true, slug: true, name: true, posterImageUrl: true },
      }),
    ]);

    const hackathonMap = new Map(myHackathons.map((h) => [h.id, h]));
    const eventMap = new Map(myEvents.map((e) => [e.id, e]));
    const festivalMap = new Map(myFestivals.map((f) => [f.id, f]));

    // 4. Fetch referrals for this referrer filtered by managed entities
    const organizerReferrals = await prisma.referralEntity.findMany({
      where: {
        referrerId: referral.referrerId,
        isDeleted: false,
        OR: [
          {
            entityType: 'HACKATHON',
            entityId: { in: Array.from(hackathonMap.keys()) },
          },
          {
            entityType: 'EVENT',
            entityId: { in: Array.from(eventMap.keys()) },
          },
          {
            entityType: 'FESTIVAL',
            entityId: { in: Array.from(festivalMap.keys()) },
          },
        ],
      },
    });

    // 5. Get stats
    const stats = await this.getReferralsWithStats(organizerReferrals);

    // Combine stats with entity details (name, slug, image)
    const opportunities = stats.map((s) => {
      let entityName = 'Unknown';
      let slug = '';
      let image: string | null = null;
      let baseUrl = '';

      if (s.entityType === 'HACKATHON') {
        const h = hackathonMap.get(s.entityId);
        if (h) {
          entityName = h.name;
          slug = h.slug;
          image = h.bannerImageUrl;
          baseUrl = `/dashboard/hackathon/${h.slug}/referrals`;
        }
      } else if (s.entityType === 'EVENT') {
        const e = eventMap.get(s.entityId);
        if (e) {
          entityName = e.name;
          slug = e.slug;
          image = e.bannerImageUrl;
          baseUrl = `/dashboard/events/${e.slug}/referrals`;
        }
      } else if (s.entityType === 'FESTIVAL') {
        const f = festivalMap.get(s.entityId);
        if (f) {
          entityName = f.name;
          slug = f.slug;
          image = f.posterImageUrl;
          baseUrl = `/dashboard/festivals/${f.slug}/referrals`;
        }
      }

      return {
        ...s,
        entityName,
        slug,
        image,
        dashboardUrl: baseUrl,
      };
    });

    return {
      referrer: {
        id: referrer.id,
        name:
          `${referrer.firstName || ''} ${referrer.lastName || ''}`.trim() ||
          'User',
        email: referrer.email,
        avatarUrl: referrer.imageUrl,
        institution:
          referrer.onboardingProfile?.college?.name ||
          referrer.onboardingProfile?.schoolName ||
          'N/A',
        location: this.formatLocation(referrer.onboardingProfile),
        profession: this.formatProfession(referrer.onboardingProfile),
        registrationDate: referrer.createdAt.toISOString(),
      },
      opportunities,
      summary: {
        totalReferrals: opportunities.length,
        totalClicks: opportunities.reduce((acc, s) => acc + s.clicks, 0),
        clicksLast24h: opportunities.reduce(
          (acc, s) => acc + s.clicksLast24h,
          0,
        ),
        totalRegistrations: opportunities.reduce(
          (acc, s) => acc + s.registrations,
          0,
        ),
        registrationsLast24h: opportunities.reduce(
          (acc, s) => acc + s.registrationsLast24h,
          0,
        ),
        activeLinks: opportunities.filter((s) => s.isActive).length,
      },
    };
  }

  async getReferralById(id: string, userId: string) {
    const referral = await prisma.referralEntity.findUnique({
      where: { id },
      include: {
        referrer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });
    if (!referral || referral.isDeleted) {
      throw new NotFoundException('Referral not found');
    }

    // Allow access if user is the referrer
    if (referral.referrerId === userId) {
      return referral;
    }

    // Otherwise check for management rights
    await this.authz.assertCanManageEntity(
      userId,
      referral.entityType as ReferralEntityTypeDto,
      referral.entityId,
    );
    return referral;
  }

  async getReferralRegistrations(
    id: string,
    userId: string,
    page = 1,
    pageSize = 10,
  ) {
    const referral = await this.getReferralById(id, userId);
    const [teamMembers, eventParticipants, leaderTeams] = await Promise.all([
      prisma.teamMemberEntity.findMany({
        where: { referralId: referral.id },
        select: {
          id: true,
          joinedAt: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              onboardingProfile: ONBOARDING_PROFILE_SELECT,
            },
          },
        },
      }),
      prisma.eventParticipantEntity.findMany({
        where: { referralId: referral.id },
        select: {
          id: true,
          joinedAt: true,
          approved: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              onboardingProfile: ONBOARDING_PROFILE_SELECT,
            },
          },
        },
      }),
      prisma.teamEntity.findMany({
        where: { referralId: referral.id },
        select: {
          id: true,
          createdAt: true,
          leader: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
              onboardingProfile: ONBOARDING_PROFILE_SELECT,
            },
          },
        },
      }),
    ]);

    const formatProfession = (profile: any) => {
      if (!profile) return 'Other';
      const categoryMap: any = {
        SCHOOL_STUDENT: 'School Student',
        COLLEGE_STUDENT: 'College Student',
        WORKING_PROFESSIONAL: 'Working Professional',
        FRESHER: 'Fresher',
        PROFESSIONAL_SCHOOL_STUDENT: 'Professional Student',
      };

      const parts = [categoryMap[profile.userCategory] || 'User'];

      if (profile.courseSpecialization)
        parts.push(profile.courseSpecialization);
      if (profile.course) parts.push(profile.course);
      if (profile.collegeCurrentYear) parts.push(profile.collegeCurrentYear);

      if (profile.userCategory === 'WORKING_PROFESSIONAL') {
        if (profile.jobTitle) parts.push(profile.jobTitle);
        if (profile.companyName) parts.push(profile.companyName);
      }

      return parts.join(' | ');
    };

    const formatLocation = (profile: any) => {
      if (!profile) return 'Unknown';
      const parts = [
        profile.locationCoords,
        profile.locationState,
        profile.locationCountry,
      ].filter(Boolean);
      return parts.join(', ') || 'Unknown';
    };

    const combined = [
      ...teamMembers.map((tm) => ({
        id: tm.id,
        name: `${tm.user.firstName ?? ''} ${tm.user.lastName ?? ''}`.trim(),
        email: tm.user.email,
        avatarUrl: tm.user.imageUrl,
        registrationDate: tm.joinedAt.toISOString(),
        institution:
          tm.user.onboardingProfile?.college?.name ||
          tm.user.onboardingProfile?.schoolName ||
          'N/A',
        location: formatLocation(tm.user.onboardingProfile),
        profession: formatProfession(tm.user.onboardingProfile),
      })),
      ...leaderTeams.map((t) => ({
        id: `leader-team:${t.id}`,
        name: `${t.leader.firstName ?? ''} ${t.leader.lastName ?? ''}`.trim(),
        email: t.leader.email,
        avatarUrl: t.leader.imageUrl,
        registrationDate: t.createdAt.toISOString(),
        institution:
          t.leader.onboardingProfile?.college?.name ||
          t.leader.onboardingProfile?.schoolName ||
          'N/A',
        location: this.formatLocation(t.leader.onboardingProfile),
        profession: this.formatProfession(t.leader.onboardingProfile),
      })),
      ...eventParticipants.map((ep) => ({
        id: ep.id,
        name: `${ep.user.firstName ?? ''} ${ep.user.lastName ?? ''}`.trim(),
        email: ep.user.email,
        avatarUrl: ep.user.imageUrl,
        registrationDate: ep.joinedAt.toISOString(),
        institution:
          ep.user.onboardingProfile?.college?.name ||
          ep.user.onboardingProfile?.schoolName ||
          'N/A',
        location: this.formatLocation(ep.user.onboardingProfile),
        profession: this.formatProfession(ep.user.onboardingProfile),
      })),
    ].sort(
      (a, b) =>
        new Date(b.registrationDate).getTime() -
        new Date(a.registrationDate).getTime(),
    );

    const start = (page - 1) * pageSize;
    return {
      data: combined.slice(start, start + pageSize),
      total: combined.length,
      page,
      pageSize,
    };
  }

  async analytics(
    query: ListReferralsQueryDto,
    userId: string,
  ): Promise<ReferralAnalyticsDto> {
    await this.authz.assertCanManageEntity(
      userId,
      query.entityType,
      query.entityId,
    );
    const refs = await prisma.referralEntity.findMany({
      where: {
        entityType: query.entityType,
        entityId: query.entityId,
        isDeleted: false,
      },
      select: {
        id: true,
        clicksCount: true,
        humanClicksCount: true,
        registrationsCount: true,
        isActive: true,
      },
    });

    const totalClicks = refs.reduce((sum, r) => sum + r.clicksCount, 0);
    const humanClicks = refs.reduce((sum, r) => sum + r.humanClicksCount, 0);
    const totalRegistrations = refs.reduce(
      (sum, r) => sum + r.registrationsCount,
      0,
    );

    return {
      totalClicks,
      humanClicks,
      referredParticipants: totalRegistrations,
      totalRegistrations,
      activeReferrers: refs.filter((r) => r.isActive).length,
      totalReferrers: refs.length,
      linksGenerated: refs.length,
    };
  }

  async deleteReferral(id: string, userId: string) {
    const referral = await this.getReferralById(id, userId);
    await prisma.referralEntity.update({
      where: { id: referral.id },
      data: { isDeleted: true, isActive: false, deletedAt: new Date() },
    });
    return { success: true };
  }

  async resolvePublic(code: string) {
    const referral = await prisma.referralEntity.findUnique({
      where: { code },
      select: {
        entityType: true,
        entityId: true,
        isActive: true,
        isDeleted: true,
      },
    });
    if (!referral || referral.isDeleted || !referral.isActive) {
      throw new NotFoundException('Referral code not found');
    }
    const slug = await this.authz.getEntityPublicSlug(
      referral.entityType as ReferralEntityTypeDto,
      referral.entityId,
    );
    if (!slug) throw new NotFoundException('Target entity not found');
    return {
      entityType: referral.entityType,
      slug,
      isActive: referral.isActive,
    };
  }

  async resolveForRegistration(input: {
    code?: string;
    userId: string;
    expectedEntityType: ReferralEntityTypeDto;
    expectedEntityId: string;
    parentFestivalId?: string | null;
  }): Promise<string | null> {
    if (!input.code) return null;
    const referral = await prisma.referralEntity.findUnique({
      where: { code: input.code },
      select: {
        id: true,
        isDeleted: true,
        isActive: true,
        referrerId: true,
        entityType: true,
        entityId: true,
      },
    });
    if (!referral || referral.isDeleted || !referral.isActive) return null;
    if (referral.referrerId === input.userId) return null;
    if (
      referral.entityType === input.expectedEntityType &&
      referral.entityId === input.expectedEntityId
    ) {
      return referral.id;
    }
    if (
      referral.entityType === ReferralEntityTypeDto.FESTIVAL &&
      input.parentFestivalId &&
      referral.entityId === input.parentFestivalId
    ) {
      return referral.id;
    }
    return null;
  }

  async trackPublicClick(input: {
    code: string;
    source?: string;
    ip: string;
    userAgent?: string;
  }) {
    const referral = await prisma.referralEntity.findUnique({
      where: { code: input.code },
      select: { id: true, isDeleted: true, isActive: true },
    });
    if (!referral || referral.isDeleted || !referral.isActive) {
      throw new NotFoundException('Referral code not found');
    }
    await this.counter.trackClick({
      referralId: referral.id,
      ip: input.ip,
      userAgent: input.userAgent,
      source: input.source,
      isBot: /bot|crawl|spider|preview/i.test(input.userAgent || ''),
    });
    return { success: true };
  }

  async markRegistrationAttributed(referralId: string): Promise<void> {
    await prisma.referralEntity.update({
      where: { id: referralId },
      data: {
        registrationsCount: { increment: 1 },
        lastRegistrationAt: new Date(),
      },
    });
  }

  async getMyReferralPerformance(userId: string) {
    const referrals = await prisma.referralEntity.findMany({
      where: {
        referrerId: userId,
        isDeleted: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    const stats = await this.getReferralsWithStats(referrals);

    const totalImpressions = stats.reduce((acc, s) => acc + s.clicks, 0);
    const impressions24h = stats.reduce((acc, s) => acc + s.clicksLast24h, 0);
    const totalRegistrations = stats.reduce(
      (acc, s) => acc + s.registrations,
      0,
    );
    const registrations24h = stats.reduce(
      (acc, s) => acc + s.registrationsLast24h,
      0,
    );
    const linksGenerated = referrals.length;
    const activeLinks = referrals.filter((r) => r.isActive).length;

    return {
      summary: {
        linksGenerated,
        activeLinks,
        totalImpressions,
        impressions24h,
        totalRegistrations,
        registrations24h,
      },
      referrals: stats,
    };
  }

  async getMyReferredUsers(userId: string) {
    const referrals = await prisma.referralEntity.findMany({
      where: {
        referrerId: userId,
        registrationsCount: { gt: 0 },
        isDeleted: false,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return this.getReferralsWithStats(referrals);
  }

  private async getReferralsWithStats(referrals: ReferralEntity[]) {
    const referralIds = referrals.map((r) => r.id);
    const { clicks: clicksLast24hMap, registrations: regMap } =
      await this.getRecentStatsBatch(referralIds);

    // 3. Batch fetch entity details
    const hackathonIds = [
      ...new Set(
        referrals
          .filter((r) => r.entityType === 'HACKATHON')
          .map((r) => r.entityId),
      ),
    ];
    const eventIds = [
      ...new Set(
        referrals
          .filter((r) => r.entityType === 'EVENT')
          .map((r) => r.entityId),
      ),
    ];
    const festivalIds = [
      ...new Set(
        referrals
          .filter((r) => r.entityType === 'FESTIVAL')
          .map((r) => r.entityId),
      ),
    ];

    const [hackathons, events, festivals] = await Promise.all([
      prisma.hackathonEntity.findMany({
        where: { id: { in: hackathonIds } },
        select: {
          id: true,
          name: true,
          organizationName: true,
          bannerImageUrl: true,
          slug: true,
        },
      }),
      prisma.eventEntity.findMany({
        where: { id: { in: eventIds } },
        select: {
          id: true,
          name: true,
          organizationName: true,
          bannerImageUrl: true,
          slug: true,
        },
      }),
      prisma.festivalEntity.findMany({
        where: { id: { in: festivalIds } },
        select: {
          id: true,
          name: true,
          organizationName: true,
          posterImageUrl: true,
          slug: true,
        },
      }),
    ]);

    const entityMap: Record<string, any> = {};
    hackathons.forEach((h) => {
      entityMap[`HACKATHON:${h.id}`] = {
        title: h.name,
        organization: h.organizationName || 'Unknown',
        thumbnail: h.bannerImageUrl || '',
        slug: h.slug,
      };
    });
    events.forEach((e) => {
      entityMap[`EVENT:${e.id}`] = {
        title: e.name,
        organization: e.organizationName || 'Unknown',
        thumbnail: e.bannerImageUrl || '',
        slug: e.slug,
      };
    });
    festivals.forEach((f) => {
      entityMap[`FESTIVAL:${f.id}`] = {
        title: f.name,
        organization: f.organizationName || 'Unknown',
        thumbnail: f.posterImageUrl || '',
        slug: f.slug,
      };
    });

    return referrals.map((ref) => {
      const details = entityMap[`${ref.entityType}:${ref.entityId}`] || {
        title: 'Unknown',
        organization: 'Unknown',
        thumbnail: '',
        slug: '',
      };

      return {
        id: ref.id,
        code: ref.code,
        entityType: ref.entityType,
        entityId: ref.entityId,
        ...details,
        clicks: ref.humanClicksCount,
        clicksLast24h: clicksLast24hMap[ref.id] || 0,
        registrations: ref.registrationsCount,
        registrationsLast24h: regMap[ref.id] || 0,
        createdAt: ref.createdAt,
        isActive: ref.isActive,
      };
    });
  }

  private formatProfession(profile: any): string {
    if (!profile) return 'Other';
    const categoryMap: any = {
      SCHOOL_STUDENT: 'School Student',
      COLLEGE_STUDENT: 'College Student',
      WORKING_PROFESSIONAL: 'Working Professional',
      FRESHER: 'Fresher',
      PROFESSIONAL_SCHOOL_STUDENT: 'Professional Student',
    };

    const parts = [categoryMap[profile.userCategory] || 'User'];

    if (profile.courseSpecialization) parts.push(profile.courseSpecialization);
    if (profile.course) parts.push(profile.course);
    if (profile.collegeCurrentYear) parts.push(profile.collegeCurrentYear);

    if (profile.userCategory === 'WORKING_PROFESSIONAL') {
      if (profile.jobTitle) parts.push(profile.jobTitle);
      if (profile.companyName) parts.push(profile.companyName);
    }

    return parts.join(' | ');
  }

  private formatLocation(profile: any): string {
    if (!profile) return 'Unknown';
    const parts = [
      profile.locationCoords,
      profile.locationState,
      profile.locationCountry,
    ].filter(Boolean);
    return parts.join(', ') || 'Unknown';
  }

  private async getRecentStatsBatch(referralIds: string[]) {
    const now = new Date();
    const start24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // 1. Batch fetch clicks from Redis
    const clicksLast24hMap =
      await this.counter.getBatchClicksLast24h(referralIds);

    // 2. Batch fetch registrations from DB
    const [eventRegs24h, teamRegs24h, teamMemberRegs24h] = await Promise.all([
      prisma.eventParticipantEntity.groupBy({
        by: ['referralId'],
        where: { referralId: { in: referralIds }, joinedAt: { gte: start24h } },
        _count: { _all: true },
      }),
      prisma.teamEntity.groupBy({
        by: ['referralId'],
        where: {
          referralId: { in: referralIds },
          createdAt: { gte: start24h },
        },
        _count: { _all: true },
      }),
      prisma.teamMemberEntity.groupBy({
        by: ['referralId'],
        where: { referralId: { in: referralIds }, joinedAt: { gte: start24h } },
        _count: { _all: true },
      }),
    ]);

    const regMap: Record<string, number> = {};
    [...eventRegs24h, ...teamRegs24h, ...teamMemberRegs24h].forEach((r) => {
      if (r.referralId) {
        regMap[r.referralId] = (regMap[r.referralId] || 0) + r._count._all;
      }
    });

    return { clicks: clicksLast24hMap, registrations: regMap };
  }
}
