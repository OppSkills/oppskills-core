import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailListener } from './email.listener';
import { EmailController } from './email.controller';
import { TeamModule } from '../team/team.module';
import { EventModule } from 'src/event/event.module';

@Module({
  imports: [EventModule, TeamModule],
  controllers: [EmailController],
  providers: [EmailService, EmailListener],
  exports: [EmailService],
})
export class EmailModule {}
