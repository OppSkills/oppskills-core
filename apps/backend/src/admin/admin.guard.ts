import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminAuthService } from './auth/auth.service';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private adminAuthService: AdminAuthService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.admin_token;

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.adminAuthService.verifyJWT(token);
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
