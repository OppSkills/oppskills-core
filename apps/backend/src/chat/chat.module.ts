import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { MediaModule } from '../media/media.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PresenceService } from './presence.service';

@Module({
  imports: [CommonModule, MediaModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PresenceService],
  exports: [ChatService],
})
export class ChatModule {}
