import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { ImageController } from './image.controller';

@Module({
  controllers: [MediaController, ImageController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
