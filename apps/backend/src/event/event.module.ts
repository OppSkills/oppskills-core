import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EventPassService } from './event-pass.service';
import { EventPassController, EventPassScanController } from './event-pass.controller';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';
import { AnalyticsModule } from 'src/analytics/analytics.module';

@Module({
  imports: [GoogleSheetsModule, AnalyticsModule],
  controllers: [EventController, EventPassController, EventPassScanController],
  providers: [EventService, EventPassService],
  exports: [EventService, EventPassService],
})
export class EventModule {}
