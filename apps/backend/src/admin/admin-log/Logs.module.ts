import { Module, forwardRef } from '@nestjs/common';
import { AdminLogsController } from './Logs.controller';
import { AdminLogsService } from './Logs.service';
import { AdminAuthModule } from '../auth/auth.module';

@Module({
  imports: [forwardRef(() => AdminAuthModule)],
  controllers: [AdminLogsController],
  providers: [AdminLogsService],
  exports: [AdminLogsService],
})
export class AdminLogsModule {}
