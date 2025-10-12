import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClerkAuthConfigService } from './common/config.service';
import { UserAccountsModule } from './user-accounts/user-accounts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env', '.env.local'],
      isGlobal: true,
    }),
    UserAccountsModule,
  ],
  controllers: [AppController],
  providers: [AppService, ClerkAuthConfigService],
})
export class AppModule {}
