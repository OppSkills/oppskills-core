import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';
// Removed unused ClerkUser import, as we are no longer relying on the full object
import { Logger } from 'src/_utils/logger';
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

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const request = context.switchToHttp().getRequest<Request>();
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
      const primaryEmail = sessionClaims.emailAddresses?.[0]?.emailAddress 
                           || (sessionClaims.email as string | undefined) 
                           || 'N/A';
      
      if (!userId) {
          this.logger.error('[canActivate] Token verified but missing user ID (sub claim).');
          throw new UnauthorizedException('Invalid claims payload.');
      }
      
      // 3. Attach the relevant user information to the request for the controller
      request['user'] = {
        id: userId,
        email: primaryEmail !== 'N/A' ? primaryEmail : undefined,
      };

      this.logger.log(`[canActivate] Token verified successfully for user:`, {
        userId: userId,
        email: primaryEmail,
      });

      return true;
      
    } catch (error) {
      this.logger.error(`[canActivate] Token verification failed:`, {
        error: error instanceof Error ? error.message : String(error),
      });

      throw new UnauthorizedException();
      
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private extractTokenFromQuery(request: Request): string | undefined {
    return request.query?.token as string;
  }
}