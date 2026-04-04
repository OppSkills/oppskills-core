import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { HackathonService } from './hackathon.service';

/**
 * HackathonManagerGuard
 *
 * Authorization strategy:
 * - Allows access if the user is the Owner of the hackathon.
 * - Allows access if the user is a Platform Admin.
 * - Allows access if the user has a MANAGER role for this specific hackathon.
 */
@Injectable()
export class HackathonManagerGuard implements CanActivate {
  constructor(private readonly hackathonService: HackathonService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    const params = request.params;
    const hackathonId = params.id || params.hackathonId;
    const slug = params.slug;

    if (!hackathonId && !slug) {
      // If neither ID nor slug is present, metadata doesn't allow resource-check.
      // This could happen on "list" endpoints which usually handle visibility in the service.
      return true;
    }

    // 1. Fetch hackathon briefly for ownership check
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: hackathonId
        ? { id: hackathonId, isDeleted: false }
        : { slug, isDeleted: false },
      select: { id: true, ownerId: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    // 2. Perform permission checks
    const isOwner = hackathon.ownerId === userId;
    const isAdmin = await this.hackathonService.isAdminUser(userId);
    const isManager = await this.hackathonService.isHackathonManager(
      hackathon.id,
      userId,
    );

    if (!isOwner && !isAdmin && !isManager) {
      throw new ForbiddenException(
        'You do not have permission to manage this hackathon.',
      );
    }

    // Attach hackathonId to request for convenience in controllers if needed
    request['hackathonId'] = hackathon.id;

    return true;
  }
}
