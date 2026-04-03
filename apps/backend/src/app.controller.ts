import { Controller, Get } from '@nestjs/common';
import { Logger } from 'src/_utils/logger';
import {
  IncompleteRegistrationReminderService,
  type IncompleteRegistrationReminderRunResult,
} from './email/incomplete-registration-reminder.service';

@Controller()
export class AppController {
  private readonly logger: Logger = new Logger(AppController.name);
  constructor(
    private readonly incompleteRegistrationReminderService: IncompleteRegistrationReminderService,
  ) {}

  @Get()
  getRoot(): string {
    return 'welcome to oppskills-core backend';
  }

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /** Observability: last incomplete-registration reminder cron result (no auth). */
  @Get('health/incomplete-registration-reminder')
  getIncompleteRegistrationReminderHealth(): {
    lastRunFinishedAt: string | null;
    lastRunResult: IncompleteRegistrationReminderRunResult | null;
    lastRunError: string | null;
  } {
    const s = this.incompleteRegistrationReminderService;
    return {
      lastRunFinishedAt: s.lastRunFinishedAt,
      lastRunResult: s.lastRunResult,
      lastRunError: s.lastRunError,
    };
  }
}
