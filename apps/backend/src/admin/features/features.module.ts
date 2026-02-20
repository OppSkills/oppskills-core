import { Module } from '@nestjs/common';
import { AdminFeaturesService } from './features.service';

@Module({
    providers: [AdminFeaturesService],
    exports: [AdminFeaturesService]
})
export class AdminFeaturesModule { }
