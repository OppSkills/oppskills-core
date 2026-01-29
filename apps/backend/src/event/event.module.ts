import { Module } from '@nestjs/common';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { EventPassService } from './event-pass.service';
import { EventPassController, EventPassScanController } from './event-pass.controller';
import { EventPaymentService } from './event-payment.service';
import { EventPaymentController } from './event-payment.controller';
import { GoogleSheetsModule } from '../google-sheets/google-sheets.module';
import { AnalyticsModule } from 'src/analytics/analytics.module';
import { PaymentsModule } from '../payments/payments.module';
import { HackathonModule } from 'src/hackathon/hackathon.module';

@Module({
  imports: [GoogleSheetsModule, AnalyticsModule, PaymentsModule, HackathonModule],
  controllers: [
    EventController,
    EventPassController,
    EventPassScanController,
    EventPaymentController,
  ],
  providers: [EventService, EventPassService, EventPaymentService],
  exports: [EventService, EventPassService, EventPaymentService],
})
export class EventModule { }
