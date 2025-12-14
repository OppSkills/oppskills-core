import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminGuard } from './admin.guard';
import { CacheService } from './cache.service';
import { ClerkAuthConfigService } from './config.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ClerkAuthConfigService, CacheService, AdminGuard],
  exports: [ClerkAuthConfigService, CacheService, AdminGuard],
})
export class CommonModule {}
