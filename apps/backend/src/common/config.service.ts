import { ConfigService } from '@nestjs/config';
import { Inject, Injectable } from '@nestjs/common';

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
    return this.configService.getOrThrow<string>('CLERK_SECRET_KEY');
  }

  get redisHost(): string {
    return this.configService.get('REDISHOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get('REDISPORT', 6379);
  }

  get redisPassword(): string {
    return this.configService.get('REDISPASSWORD', '');
  }

  /**
   * Comma-separated Clerk user IDs that are allowed to perform admin actions.
   * Example: "user_abc,user_def"
   */
  get adminUserIds(): string[] {
    const raw = this.configService.get<string>('ADMIN_USER_IDS', '');
    return raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
  }

  // Intentionally no Clerk-role config here.
  // Authorization should be driven by our own DB `UserEntity.accessLevel`.
}
