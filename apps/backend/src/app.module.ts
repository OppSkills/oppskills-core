import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkAuthConfigService } from './common/config.service';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env' : '.env.local',
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
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
  ],
  controllers: [AppController],
  providers: [AppService, ClerkAuthConfigService],
})
export class AppModule {}
