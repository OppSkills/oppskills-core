import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClerkAuthConfigService } from './config.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [ClerkAuthConfigService, CacheService],
  exports: [ClerkAuthConfigService, CacheService],
})
export class CommonModule {}
