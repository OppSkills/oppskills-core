import { Injectable } from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
import { prisma } from '@oppskills/db';
import { ClerkAuthConfigService } from './config.service';

@Injectable()
export class OptionalAuthService {
  constructor(private readonly configService: ClerkAuthConfigService) {}

  async resolveUserId(req: Request): Promise<string | undefined> {
    if (process.env.AUTH_BYPASS === 'true') {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'development' || nodeEnv === 'test') {
        const headerUserId = req.header('x-user-id');
        if (
          typeof headerUserId === 'string' &&
          headerUserId.trim().length > 0
        ) {
          return headerUserId.trim();
        }
      }
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return undefined;

    const token = authHeader.substring(7).trim();
    if (!token) return undefined;

    try {
      const sessionClaims = await verifyToken(token, {
        secretKey: this.configService.clerkSecretKey,
        clockSkewInMs: 15000,
      });
      const userId = sessionClaims.sub;
      if (!userId) return undefined;

      const primaryEmail =
        sessionClaims.emailAddresses?.[0]?.emailAddress ||
        (typeof sessionClaims.email === 'string'
          ? sessionClaims.email
          : undefined);

      if (primaryEmail) {
        await prisma.userEntity
          .upsert({
            where: { id: userId },
            update: { email: primaryEmail },
            create: { id: userId, email: primaryEmail },
          })
          .catch(() => {});
      }

      return userId;
    } catch {
      return undefined;
    }
  }
}
