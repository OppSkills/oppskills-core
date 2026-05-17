import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminGuard } from './admin.guard';
import { CacheService } from './cache.service';
import { ClerkAuthConfigService } from './config.service';
import { RateLimitGuard } from './rate-limit/rate-limit.guard';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ClerkAuthConfigService, CacheService, AdminGuard, RateLimitGuard],
  exports: [ClerkAuthConfigService, CacheService, AdminGuard, RateLimitGuard],
})
export class CommonModule {}
