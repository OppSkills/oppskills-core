import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkAuthConfigService } from './common/config.service';
import { CommonModule } from './common/common.module';
import { RateLimitGuard } from './common/rate-limit/rate-limit.guard';
import { FestivalModule } from './festival/festival.module';
import { HackathonModule } from './hackathon/hackathon.module';
import { TeamModule } from './team/team.module';
import { UserAccountsModule } from './user-accounts/user-accounts.module';
import { MediaModule } from './media/media.module';
import { CollegesModule } from './colleges/colleges.module';
import { EventModule } from './event/event.module';
import { GoogleSheetsModule } from './google-sheets/google-sheets.module';
import { PaymentsModule } from './payments/payments.module';
import { EmailModule } from './email/email.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { AdminModule } from './admin/admin.module';
import { OpportunityModule } from './opportunity/opportunity.module';
import { ReferralModule } from './referral/referral.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env' : '.env.local',
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    CommonModule,
    UserAccountsModule,
    TeamModule,
    HackathonModule,
    FestivalModule,
    MediaModule,
    CollegesModule,
    EventModule,
    GoogleSheetsModule,
    PaymentsModule,
    EmailModule,
    AnalyticsModule,
    WaitlistModule,
    AdminModule,
    OpportunityModule,
    ReferralModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ClerkAuthConfigService,
    /**
     * Global rate-limiter — runs on every request before auth guards.
     * Unauthenticated: 60 req/min per IP
     * Authenticated:  200 req/min per user
     * Override with @RateLimit() or exempt with @SkipRateLimit().
     */
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}
