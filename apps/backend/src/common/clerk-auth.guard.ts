import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';
import {User as ClerkUser} from '@clerk/backend';
import { Logger } from 'src/_utils/logger';
import { ClerkAuthConfigService } from './config.service';


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

      const sessionClaims = await verifyToken(token, {
        secretKey: this.configService.clerkWebhookSecret
      });

      const user = sessionClaims.user as ClerkUser;
      request['user'] = user;

      this.logger.log(`[canActivate] Token verified successfully for user:`, {
        userId: user.id,
        email: user.emailAddresses[0].emailAddress,
      });

      return true;
      
    } catch (error) {
      this.logger.error(`[canActivate] Token verification failed:`, {
        error: error.message,
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
