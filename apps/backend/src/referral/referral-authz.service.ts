import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { ReferralEntityTypeDto } from '@oppskills/types';
import { ClerkAuthConfigService } from 'src/common/config.service';

@Injectable()
export class ReferralAuthzService {
  constructor(private readonly authConfig: ClerkAuthConfigService) {}

  private async isAdmin(userId: string): Promise<boolean> {
    return this.authConfig.adminUserIds.includes(userId);
  }

  async assertCanManageEntity(
    userId: string,
    entityType: ReferralEntityTypeDto,
    entityId: string,
  ): Promise<void> {
    if (entityType === ReferralEntityTypeDto.HACKATHON) {
      const hackathon = await prisma.hackathonEntity.findUnique({
        where: { id: entityId, isDeleted: false },
        include: {
          userRoles: {
            where: { userId, role: 'MANAGER' },
          },
        },
      });
      if (!hackathon) throw new NotFoundException('Hackathon not found');
      if (hackathon.ownerId === userId || hackathon.userRoles.length > 0)
        return;
      if (await this.isAdmin(userId)) return;
      throw new ForbiddenException('You are not allowed to manage referrals.');
    }

    if (entityType === ReferralEntityTypeDto.EVENT) {
      const event = await prisma.eventEntity.findUnique({
        where: { id: entityId, isDeleted: false },
        include: {
          userRoles: {
            where: { userId, role: 'MANAGER' },
          },
        },
      });
      if (!event) throw new NotFoundException('Event not found');
      if (event.ownerId === userId || event.userRoles.length > 0) return;
      if (await this.isAdmin(userId)) return;
      throw new ForbiddenException('You are not allowed to manage referrals.');
    }

    const festival = await prisma.festivalEntity.findUnique({
      where: { id: entityId, isDeleted: false },
      select: { organizerId: true },
    });
    if (!festival) throw new NotFoundException('Festival not found');
    if (festival.organizerId === userId) return;
    if (await this.isAdmin(userId)) return;
    throw new ForbiddenException('You are not allowed to manage referrals.');
  }

  async getEntityPublicSlug(
    entityType: ReferralEntityTypeDto,
    entityId: string,
  ): Promise<string | null> {
    if (entityType === ReferralEntityTypeDto.HACKATHON) {
      const hackathon = await prisma.hackathonEntity.findUnique({
        where: { id: entityId, isDeleted: false },
        select: { slug: true },
      });
      return hackathon?.slug ?? null;
    }

    if (entityType === ReferralEntityTypeDto.EVENT) {
      const event = await prisma.eventEntity.findUnique({
        where: { id: entityId, isDeleted: false },
        select: { slug: true },
      });
      return event?.slug ?? null;
    }

    const festival = await prisma.festivalEntity.findUnique({
      where: { id: entityId, isDeleted: false },
      select: { slug: true },
    });
    return festival?.slug ?? null;
  }
}
