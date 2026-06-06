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
    action: 'read' | 'write' = 'write',
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

    if (entityType === ReferralEntityTypeDto.FESTIVAL) {
      const festival = await prisma.festivalEntity.findUnique({
        where: { id: entityId, isDeleted: false },
        select: { organizerId: true },
      });
      if (!festival) throw new NotFoundException('Festival not found');
      if (festival.organizerId === userId) return;
      if (await this.isAdmin(userId)) return;
      throw new ForbiddenException('You are not allowed to manage referrals.');
    }

    if (entityType === ReferralEntityTypeDto.COMMUNITY) {
      const community = await prisma.communityEntity.findUnique({
        where: { id: entityId },
        select: { ownerId: true },
      });
      if (!community) throw new NotFoundException('Community not found');

      const isOwner = community.ownerId === userId;
      if (isOwner || (await this.isAdmin(userId))) return;

      const member = await prisma.communityMemberEntity.findUnique({
        where: {
          communityId_userId: {
            communityId: entityId,
            userId,
          },
        },
        select: { accessControlRole: true },
      });

      if (!member) {
        throw new ForbiddenException('You do not have access to this community.');
      }

      const role = member.accessControlRole;
      if (role === 'ADMIN' || role === 'MODERATOR') return;
      if (role === 'READ_ONLY' && action === 'read') return;

      throw new ForbiddenException(
        action === 'read'
          ? 'You do not have permission to view community referrals.'
          : 'You do not have permission to manage community referrals.',
      );
    }

    throw new ForbiddenException('Unsupported entity type for referrals.');
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

    if (entityType === ReferralEntityTypeDto.COMMUNITY) {
      const community = await prisma.communityEntity.findUnique({
        where: { id: entityId },
        select: { handle: true },
      });
      return community?.handle ?? null;
    }

    const festival = await prisma.festivalEntity.findUnique({
      where: { id: entityId, isDeleted: false },
      select: { slug: true },
    });
    return festival?.slug ?? null;
  }
}
