import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
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
      const exists = await prisma.referralEntity.findUnique({ where: { code } });
      if (!exists) return code;
    }
    throw new BadRequestException('Failed to generate referral code');
  }

  async lookupUser(dto: LookupUserDto, userId: string) {
    await this.authz.assertCanManageEntity(userId, dto.entityType, dto.entityId);
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
    await this.authz.assertCanManageEntity(userId, dto.entityType, dto.entityId);
    const referrer = await prisma.userEntity.findFirst({
      where: { email: { equals: dto.referrerEmail.trim(), mode: 'insensitive' } },
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
      const slug = await this.authz.getEntityPublicSlug(dto.entityType, dto.entityId);
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

    const withDeltas = await Promise.all(
      rows.map(async (row) => ({
        ...row,
        clicksRecent: await this.counter.getClicksLast24h(row.id),
        registrationsRecent: 0,
      })),
    );
    return { data: withDeltas, total, page, pageSize };
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
            },
          },
        },
      }),
    ]);

    const combined = [
      ...teamMembers.map((tm) => ({
        id: tm.id,
        name: `${tm.user.firstName ?? ''} ${tm.user.lastName ?? ''}`.trim(),
        email: tm.user.email,
        avatarUrl: tm.user.imageUrl,
        registrationDate: tm.joinedAt.toISOString(),
        status: 'Registered',
      })),
      ...leaderTeams.map((t) => ({
        id: `leader-team:${t.id}`,
        name: `${t.leader.firstName ?? ''} ${t.leader.lastName ?? ''}`.trim(),
        email: t.leader.email,
        avatarUrl: t.leader.imageUrl,
        registrationDate: t.createdAt.toISOString(),
        status: 'Registered (team leader)',
      })),
      ...eventParticipants.map((ep) => ({
        id: ep.id,
        name: `${ep.user.firstName ?? ''} ${ep.user.lastName ?? ''}`.trim(),
        email: ep.user.email,
        avatarUrl: ep.user.imageUrl,
        registrationDate: ep.joinedAt.toISOString(),
        status: ep.approved ? 'Participated' : 'Registered',
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

  async analytics(query: ListReferralsQueryDto, userId: string): Promise<ReferralAnalyticsDto> {
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
      select: { entityType: true, entityId: true, isActive: true, isDeleted: true },
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
    await this.counter.incrementRegistration(referralId);
  }
}
