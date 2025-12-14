import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import type { Request } from 'express';
// Removed unused ClerkUser import, as we are no longer relying on the full object
import { Logger } from 'src/_utils/logger';
import { prisma } from '@oppskills/db';
import { ClerkAuthConfigService } from './config.service';

// Extend the Request object to safely add the 'user' property for type clarity (Optional, but good practice)
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email?: string;
    };
  }
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(private readonly configService: ClerkAuthConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // -----------------------------
    // Dev-only auth bypass for curl
    // -----------------------------
    // When AUTH_BYPASS=true, you can pass X-User-Id to authenticate locally without Clerk.
    if (process.env.AUTH_BYPASS === 'true') {
      const headerUserId = request.header('x-user-id');
      if (typeof headerUserId === 'string' && headerUserId.trim().length > 0) {
        const userId = headerUserId.trim();
        const email = request.header('x-user-email') || `${userId}@local.test`;

        // Ensure user exists (FKs require it).
        await prisma.userEntity.upsert({
          where: { id: userId },
          update: {
            email,
          },
          create: {
            id: userId,
            email,
          },
        });

        request.user = { id: userId, email };
        this.logger.log(
          '[canActivate] AUTH_BYPASS active; authenticated user',
          {
            userId,
            email,
          },
        );
        return true;
      }
    }

    let token = this.extractTokenFromHeader(request);
    if (!token) {
      token = this.extractTokenFromQuery(request);
    }
    if (!token) {
      this.logger.error('[canActivate] No token found in request');
      throw new UnauthorizedException();
    }

    try {
      // 1. Verify the token using the correct secret key
      const sessionClaims = await verifyToken(token, {
        // This MUST be the Secret Key (sk_live_ or sk_test_)
        secretKey: this.configService.clerkSecretKey,
        clockSkewInMs: 15000,
      });

      // 2. Extract User Data from the verified JWT claims (payload)
      // 'sub' (subject) is the standard JWT field for the authenticated User ID.
      const userId = sessionClaims.sub;
      // The email is often available as a direct claim on the payload
      const primaryEmail =
        sessionClaims.emailAddresses?.[0]?.emailAddress ||
        (typeof sessionClaims.email === 'string'
          ? sessionClaims.email
          : undefined) ||
        undefined;

      if (!userId) {
        this.logger.error(
          '[canActivate] Token verified but missing user ID (sub claim).',
        );
        throw new UnauthorizedException('Invalid claims payload.');
      }

      // 3. Attach the relevant user information to the request for the controller
      request.user = {
        id: userId,
        email: primaryEmail,
      };

      this.logger.log('[canActivate] Token verified successfully for user:', {
        userId: userId,
        email: primaryEmail,
      });

      return true;
    } catch (error) {
      this.logger.error('[canActivate] Token verification failed:', {
        error: error instanceof Error ? error.message : `${error}`,
      });

      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractTokenFromQuery(request: Request): string | undefined {
    const tokenCandidate = request.query?.token;
    if (typeof tokenCandidate === 'string') return tokenCandidate;
    if (Array.isArray(tokenCandidate)) {
      const first = tokenCandidate[0];
      return typeof first === 'string' ? first : undefined;
    }
    return undefined;
  }
}
