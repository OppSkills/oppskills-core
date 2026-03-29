import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailListener } from './email.listener';
import { EmailController } from './email.controller';
import { TeamModule } from '../team/team.module';
import { EventModule } from 'src/event/event.module';
import { IncompleteRegistrationReminderService } from './incomplete-registration-reminder.service';
import { IncompleteRegistrationReminderCron } from './incomplete-registration-reminder.cron';

@Module({
  imports: [EventModule, TeamModule],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailListener,
    IncompleteRegistrationReminderService,
    IncompleteRegistrationReminderCron,
  ],
  exports: [EmailService],
})
export class EmailModule {}
