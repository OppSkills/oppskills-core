import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminGuard } from './admin.guard';
import { CacheService } from './cache.service';
import { ClerkAuthConfigService } from './config.service';
import { OptionalAuthService } from './optional-auth.service';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    ClerkAuthConfigService,
    CacheService,
    AdminGuard,
    RateLimitGuard,
    OptionalAuthService,
  ],
  exports: [
    ClerkAuthConfigService,
    CacheService,
    AdminGuard,
    RateLimitGuard,
    OptionalAuthService,
  ],
})
export class CommonModule {}
