import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './payments.controller';
import { AdminPaymentsService } from './payments.service';
import { AdminLogsModule } from '../admin-log/Logs.module';
import { AdminAuthModule } from '../auth/auth.module';

@Module({
  imports: [AdminLogsModule, AdminAuthModule],
  controllers: [AdminPaymentsController],
  providers: [AdminPaymentsService],
  exports: [AdminPaymentsService],
})
export class AdminPaymentsModule {}
