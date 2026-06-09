import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { MediaModule } from '../media/media.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PresenceService } from './presence.service';
import { ChatAttachmentsService } from './services/chat-attachments.service';
import { ChatAuthorizationService } from './services/chat-authorization.service';
import { ChatMapper } from './services/chat.mapper';
import { ChatSearchService } from './services/chat-search.service';
import { ConversationsService } from './services/conversations.service';
import { GroupsService } from './services/groups.service';
import { MessagesService } from './services/messages.service';

@Module({
  imports: [CommonModule, MediaModule],
  controllers: [ChatController],
  providers: [
    ChatMapper,
    ChatAuthorizationService,
    ConversationsService,
    MessagesService,
    GroupsService,
    ChatSearchService,
    ChatAttachmentsService,
    ChatService,
    ChatGateway,
    PresenceService,
  ],
  exports: [
    ChatService,
    ChatMapper,
    ChatAuthorizationService,
    ConversationsService,
    MessagesService,
    GroupsService,
    ChatSearchService,
    ChatAttachmentsService,
  ],
})
export class ChatModule {}
