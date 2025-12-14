import { Controller, Get } from '@nestjs/common';
import { Logger } from 'src/_utils/logger';

@Controller()
export class AppController {
  private readonly logger: Logger = new Logger(AppController.name);
  constructor() {}

  @Get()
  getRoot(): string {
    return 'welcome to oppskills-core backend';
  }

  @Get('health')
  getHealth(): string {
    return 'OK';
  }
}
