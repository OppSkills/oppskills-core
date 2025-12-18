import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkAuthConfigService } from './common/config.service';
import { FestivalModule } from './festival/festival.module';
import { HackathonModule } from './hackathon/hackathon.module';
import { TeamModule } from './team/team.module';
import { UserAccountsModule } from './user-accounts/user-accounts.module';
import { MediaModule } from "./media/media.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'production' ? '.env' : '.env.local',
      isGlobal: true,
    }),
    UserAccountsModule,
    HackathonModule,
    FestivalModule,
    TeamModule,
    MediaModule,
  ],
  controllers: [AppController],
  providers: [AppService, ClerkAuthConfigService],
})
export class AppModule {}
