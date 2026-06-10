import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { ImageController } from './image.controller';
import { VideoThumbnailService } from './video-thumbnail.service';

@Module({
  controllers: [MediaController, ImageController],
  providers: [MediaService, VideoThumbnailService],
  exports: [MediaService, VideoThumbnailService],
})
export class MediaModule {}
