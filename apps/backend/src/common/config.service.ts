import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';

@Injectable()
export class ClerkAuthConfigService {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {}

  get clerkWebhookSecret(): string {
    const secret = this.configService.get('CLERK_WEBHOOK_SECRET');
    return secret;
  }

  get clerkSecretKey(): string {
    return this.configService.get('CLERK_SECRET_KEY') || '';
  }

  get redisHost(): string {
    return this.configService.get('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get('REDIS_PORT', 6379);
  }

  get redisPassword(): string {
    return this.configService.get('REDIS_PASSWORD', '');
  }
}
