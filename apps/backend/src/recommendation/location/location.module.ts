import { Module } from '@nestjs/common';
import { LocationController } from './location.controller';
import { UserLocationController } from './user-location.controller';
import { LocationService } from './location.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  controllers: [LocationController, UserLocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}
