import { Module } from '@nestjs/common';
import { AdminPaymentsController } from './payments.controller';
import { AdminPaymentsService } from './payments.service';
import { AdminAuthModule } from '../auth/auth.module';

@Module({
    imports: [AdminAuthModule],
    controllers: [AdminPaymentsController],
    providers: [AdminPaymentsService],
    exports: [AdminPaymentsService]
})
export class AdminPaymentsModule { }
