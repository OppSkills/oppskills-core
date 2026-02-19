import { Module, forwardRef } from '@nestjs/common';

import { AdminStatsController } from './stats.controller';
import { AdminStatsService } from './stats.service';
import { AdminModule } from '../admin.module';

@Module({
    imports: [forwardRef(() => AdminModule)],
    controllers: [AdminStatsController],
    providers: [AdminStatsService],
    exports: [AdminStatsService]
})
export class StatsModule { }
