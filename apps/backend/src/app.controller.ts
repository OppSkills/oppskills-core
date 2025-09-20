import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Logger } from 'src/_utils/logger';

@Controller()
export class AppController {
  private readonly logger: Logger = new Logger(AppController.name);
  constructor() {}

  @Get('health')
  getHealth(): string {
    return 'OK';
  }

}
