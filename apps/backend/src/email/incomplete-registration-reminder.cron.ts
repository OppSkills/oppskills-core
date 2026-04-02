import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IncompleteRegistrationReminderService } from './incomplete-registration-reminder.service';

@Injectable()
export class IncompleteRegistrationReminderCron {
  private readonly logger = new Logger(IncompleteRegistrationReminderCron.name);

  constructor(
    private readonly reminderService: IncompleteRegistrationReminderService,
  ) {}

  /** Every 15 minutes — catch paid-but-incomplete registrations sooner */
  @Cron('*/15 * * * *')
  async handleIncompleteRegistrationReminders(): Promise<void> {
    try {
      await this.reminderService.run();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : JSON.stringify(err);
      this.logger.error(
        `Incomplete registration reminder run failed: ${message}`,
      );
    }
  }
}
