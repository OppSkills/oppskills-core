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

    /**
     * We intentionally read `access_level` via SQL instead of relying on generated Prisma types
     * so that authorization remains stable even if editor type caches lag behind migrations.
     */
    const rows = await prisma.$queryRaw<
      Array<{ access_level: AccessLevelValue }>
    >`
      SELECT "access_level"
      FROM "oppskills"."user"
      WHERE "id" = ${userId}
      LIMIT 1
    `;

    const accessLevel = rows[0]?.access_level;
    if (!accessLevel) {
      throw new ForbiddenException('User not found in database.');
    }

    if (accessLevel !== 'ADMIN') {
      throw new ForbiddenException('Admin access required.');
    }

    return true;
  }
}
