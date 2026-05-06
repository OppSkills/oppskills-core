import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationQueue } from './queue/notification.queue';
import { NotificationWorker } from './queue/notification.worker';
import { RedisProvider } from '../redis.provider';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationService,
    NotificationQueue,
    NotificationWorker,
    RedisProvider,
  ],
  exports: [NotificationService, NotificationQueue],
})
export class NotificationModule {}
