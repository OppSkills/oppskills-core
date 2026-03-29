import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { IncompleteRegistrationReminderService } from './incomplete-registration-reminder.service';

@Injectable()
export class IncompleteRegistrationReminderCron {
  private readonly logger = new Logger(IncompleteRegistrationReminderCron.name);

  constructor(
    private readonly reminderService: IncompleteRegistrationReminderService,
  ) {}

  /** Every 6 hours at minute 0 */
  @Cron('0 */6 * * *')
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
