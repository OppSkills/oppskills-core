import { Module, forwardRef } from '@nestjs/common';
import { AdminAuthController } from './auth.controller';
import { AdminAuthService } from './auth.service';
import { AdminLogsModule } from '../admin-log/Logs.module';

@Module({
    imports: [forwardRef(() => AdminLogsModule)],
    controllers: [AdminAuthController],
    providers: [AdminAuthService],
    exports: [AdminAuthService]
})
export class AdminAuthModule { }
