import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import {
  GenerateReferralDto,
  TrackClickDto,
  ReferralEntityTypeDto,
  ReferredRegistrationDto,
} from '@oppskills/types';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 8);

@Injectable()
export class ReferralsService {
  async resolveCode(code: string) {
    const referral = await prisma.referralEntity.findUnique({
      where: { code },
      include: {
        referrer: {
          select: { id: true, firstName: true, lastName: true, imageUrl: true },
        },
      },
    });

    if (!referral) {
      throw new NotFoundException('Referral code not found');
    }

    return referral;
  }

  async trackClick(dto: TrackClickDto) {
    const referral = await prisma.referralEntity.findUnique({
      where: { code: dto.code },
    });

    if (!referral) {
      throw new NotFoundException('Referral code not found');
    }

    await prisma.referralEntity.update({
      where: { id: referral.id },
      data: { clicks: { increment: 1 } },
    });

    await prisma.referralClickEntity.create({
      data: {
        referralId: referral.id,
        source: dto.source,
      },
    });

    return { success: true };
  }

  async generateReferral(dto: GenerateReferralDto) {
    // 1. Find user by email
    const user = await prisma.userEntity.findUnique({
      where: { email: dto.referrerEmail },
    });

    if (!user) {
      throw new BadRequestException('User with that email does not exist');
    }

    // 2. Validate entity exists
    if (dto.entityType === ReferralEntityTypeDto.HACKATHON) {
      const hackathon = await prisma.hackathonEntity.findUnique({
        where: { id: dto.entityId },
      });
      if (!hackathon) throw new NotFoundException('Hackathon not found');
    } else if (dto.entityType === ReferralEntityTypeDto.EVENT) {
      const event = await prisma.eventEntity.findUnique({
        where: { id: dto.entityId },
      });
      if (!event) throw new NotFoundException('Event not found');
    } else if (dto.entityType === ReferralEntityTypeDto.FESTIVAL) {
      const festival = await prisma.festivalEntity.findUnique({
        where: { id: dto.entityId },
      });
      if (!festival) throw new NotFoundException('Festival not found');
    }

    // 3. Check if referral already exists
    const existing = await prisma.referralEntity.findFirst({
      where: {
        entityType: dto.entityType as any,
        entityId: dto.entityId,
        referrerId: user.id,
      },
    });

    if (existing) {
      return existing;
    }

    // 4. Generate unique code
    const code = `REF_${nanoid()}`.toUpperCase();

    // 5. Create
    const referral = await prisma.referralEntity.create({
      data: {
        code,
        entityType: dto.entityType as any,
        entityId: dto.entityId,
        referrerId: user.id,
      },
    });

    // TODO: if dto.sendEmail === true, send email to referrer

    return referral;
  }

  async getMyPerformance(userId: string) {
    // Aggregates performance
    const referrals = await prisma.referralEntity.findMany({
      where: { referrerId: userId },
      include: {
        _count: {
          select: {
            hackathonRegistrationSubmissions: true,
            eventRegistrationSubmissions: true,
          },
        },
      },
    });

    let totalClicks = 0;
    let totalRegistrations = 0;
    const linksGenerated = referrals.length;

    for (const ref of referrals) {
      totalClicks += ref.clicks;
      totalRegistrations +=
        ref._count.hackathonRegistrationSubmissions +
        ref._count.eventRegistrationSubmissions;
    }

    return {
      totalClicks,
      humanClicks: totalClicks, // Assuming 1:1 for now
      referredParticipants: totalRegistrations,
      totalRegistrations,
      linksGenerated,
    };
  }

  async getMyReferredUsers(userId: string) {
    // Fetch all referrals of this user and include the submissions
    const referrals = await prisma.referralEntity.findMany({
      where: { referrerId: userId },
      include: {
        hackathonRegistrationSubmissions: {
          include: {
            user: true,
          },
        },
        eventRegistrationSubmissions: {
          include: {
            user: true,
          },
        },
      },
    });

    const users: ReferredRegistrationDto[] = [];

    for (const ref of referrals) {
      for (const sub of ref.hackathonRegistrationSubmissions) {
        users.push({
          name: `${sub.user.firstName || ''} ${sub.user.lastName || ''}`.trim() || 'Unknown',
          email: sub.user.email,
          registrationDate: sub.createdAt.toISOString(),
          status: 'REGISTERED',
        });
      }
      for (const sub of ref.eventRegistrationSubmissions) {
        users.push({
          name: `${sub.user.firstName || ''} ${sub.user.lastName || ''}`.trim() || 'Unknown',
          email: sub.user.email,
          registrationDate: sub.createdAt.toISOString(),
          status: 'REGISTERED',
        });
      }
    }

    return users.sort(
      (a, b) =>
        new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()
    );
  }

  async getReferralsByEntity(entityType: ReferralEntityTypeDto, entityId: string) {
    const referrals = await prisma.referralEntity.findMany({
      where: {
        entityType: entityType as any,
        entityId,
      },
      include: {
        referrer: {
          select: { id: true, firstName: true, lastName: true, email: true, imageUrl: true }
        },
        _count: {
          select: {
            hackathonRegistrationSubmissions: true,
            eventRegistrationSubmissions: true,
          }
        }
      }
    });

    return referrals.map(ref => ({
      id: ref.id,
      name: `${ref.referrer.firstName || ''} ${ref.referrer.lastName || ''}`.trim() || 'Unknown',
      email: ref.referrer.email,
      link: `www.oppskills.com/re/${ref.code}`,
      clicks: ref.clicks,
      registrations: ref._count.hackathonRegistrationSubmissions + ref._count.eventRegistrationSubmissions,
      clicksLast24: Math.floor(ref.clicks * 0.1), // dummy logic for now
      regsLast24: 0,
      avatarUrl: ref.referrer.imageUrl,
      isOrganizer: false,
    }));
  }

  async getAnalytics(entityType: ReferralEntityTypeDto, entityId: string) {
    const referrals = await prisma.referralEntity.findMany({
      where: { entityType: entityType as any, entityId, isActive: true },
      include: {
        _count: {
          select: {
            hackathonRegistrationSubmissions: true,
            eventRegistrationSubmissions: true,
          }
        }
      }
    });

    let totalClicks = 0;
    let totalRegistrations = 0;
    
    for (const ref of referrals) {
      totalClicks += ref.clicks;
      totalRegistrations += ref._count.hackathonRegistrationSubmissions + ref._count.eventRegistrationSubmissions;
    }

    return {
      totalClicks,
      humanClicks: totalClicks,
      referredParticipants: totalRegistrations,
      totalRegistrations,
      activeReferrers: referrals.length,
      totalReferrers: referrals.length,
      linksGenerated: referrals.length,
    };
  }

  async lookupUser(email: string, entityType: ReferralEntityTypeDto, entityId: string) {
    const user = await prisma.userEntity.findUnique({
      where: { email },
      select: { id: true, email: true, firstName: true, lastName: true, imageUrl: true }
    });
    if (!user) throw new NotFoundException('User not found with this email');
    return user;
  }

  async getReferrerDetails(id: string) {
    const referral = await prisma.referralEntity.findUnique({
      where: { id },
      include: {
        referrer: true,
      }
    });
    if (!referral) throw new NotFoundException('Referral not found');

    return {
      referrer: {
        id: referral.referrer.id,
        name: `${referral.referrer.firstName || ''} ${referral.referrer.lastName || ''}`.trim() || 'Unknown',
        email: referral.referrer.email,
        avatarUrl: referral.referrer.imageUrl,
        institution: 'N/A',
        location: 'N/A',
        profession: 'N/A',
        registrationDate: referral.referrer.createdAt.toISOString()
      },
      opportunities: [
        {
          id: referral.id,
          code: referral.code,
          entityType: referral.entityType,
          entityId: referral.entityId,
          clicks: referral.clicks,
          clicksLast24h: 0,
          registrations: 0,
          registrationsLast24h: 0,
          createdAt: referral.createdAt.toISOString(),
          isActive: referral.isActive,
          entityName: 'Promoted Event',
          slug: 'promoted-event',
          image: null,
          dashboardUrl: null
        }
      ],
      summary: {
        totalReferrals: 1,
        totalClicks: referral.clicks,
        clicksLast24h: 0,
        totalRegistrations: 0,
        registrationsLast24h: 0,
        activeLinks: referral.isActive ? 1 : 0
      }
    };
  }

  async getRegistrations(id: string, page: string = '1', pageSize: string = '10') {
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const take = parseInt(pageSize);

    const referral = await prisma.referralEntity.findUnique({
      where: { id },
      include: {
        hackathonRegistrationSubmissions: {
          include: { user: true },
          skip,
          take,
        },
        eventRegistrationSubmissions: {
          include: { user: true },
          skip,
          take,
        }
      }
    });
    
    if (!referral) throw new NotFoundException('Referral not found');

    const data: any[] = [];
    for (const sub of referral.hackathonRegistrationSubmissions) {
      data.push({
        id: sub.id,
        name: `${sub.user.firstName || ''} ${sub.user.lastName || ''}`.trim() || 'Unknown',
        email: sub.user.email,
        avatarUrl: sub.user.imageUrl,
        registrationDate: sub.createdAt.toISOString(),
        institution: 'N/A',
        location: 'N/A',
        profession: 'N/A'
      });
    }

    return {
      data,
      total: data.length, // simplify for now
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  }

  async getReferralDetails(id: string) {
    const referral = await prisma.referralEntity.findUnique({ where: { id } });
    if (!referral) throw new NotFoundException('Referral not found');
    return referral;
  }

  async deleteReferral(id: string) {
    const referral = await prisma.referralEntity.findUnique({ where: { id } });
    if (!referral) throw new NotFoundException('Referral not found');
    
    await prisma.referralEntity.update({
      where: { id },
      data: { isActive: false }
    });

    return { success: true };
  }
}
