import { Module, forwardRef } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailListener } from './email.listener';
import { EmailController } from './email.controller';
import { TeamModule } from '../team/team.module';
import { EventModule } from 'src/event/event.module';
import { IncompleteRegistrationReminderService } from './incomplete-registration-reminder.service';
import { IncompleteRegistrationReminderCron } from './incomplete-registration-reminder.cron';
import { HackathonModule } from 'src/hackathon/hackathon.module';

@Module({
  imports: [
    forwardRef(() => EventModule),
    forwardRef(() => TeamModule),
    forwardRef(() => HackathonModule),
  ],
  controllers: [EmailController],
  providers: [
    EmailService,
    EmailListener,
    IncompleteRegistrationReminderService,
    IncompleteRegistrationReminderCron,
  ],
  exports: [EmailService, IncompleteRegistrationReminderService],
})
export class EmailModule {}
