import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';
import { prisma } from '@oppskills/db';

type AccessLevelValue = 'ADMIN' | 'USER' | 'VIEWER';

/**
 * AdminGuard
 *
 * Authorization strategy:
 * - We do NOT depend on Clerk roles/metadata.
 * - Every user has a DB-backed `accessLevel` (default USER).
 * - Admin-only endpoints require `accessLevel === ADMIN`.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.id;
    if (!userId) {
      throw new ForbiddenException('User not found on request.');
    }

    const user = await prisma.userEntity.findUnique({
      where: { id: userId },
      select: { accessLevel: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found in database.');
    }

    if (user.accessLevel !== 'ADMIN') {
      throw new ForbiddenException('Admin access required.');
    }

    return true;
  }
}
