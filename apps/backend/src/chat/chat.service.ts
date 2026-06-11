import { Injectable } from '@nestjs/common';
import { AttachmentKind } from '@oppskills/db';
import type {
  ChatConversationDetailDto,
  ChatConversationListItemDto,
  ChatCursorPageDto,
  ChatDeliveryStatus,
  ChatMemberDto,
  ChatMemberProfileDto,
  ChatMessageDto,
  ChatSearchResultDto,
} from '@oppskills/types';
import type { SendChatMessageDto } from './dto/chat.dto';
import { ChatAttachmentsService } from './services/chat-attachments.service';
import { ChatAuthorizationService } from './services/chat-authorization.service';
import { ChatMapper } from './services/chat.mapper';
import { ChatSearchService } from './services/chat-search.service';
import { ConversationsService } from './services/conversations.service';
import { GroupsService } from './services/groups.service';
import { MessagesService } from './services/messages.service';
import type { UserSelect } from './services/chat.constants';

@Injectable()
export class ChatService {
  constructor(
    private readonly mapper: ChatMapper,
    private readonly auth: ChatAuthorizationService,
    private readonly conversations: ConversationsService,
    private readonly messages: MessagesService,
    private readonly groups: GroupsService,
    private readonly chatSearch: ChatSearchService,
    private readonly attachments: ChatAttachmentsService,
  ) {}

  displayName(user: UserSelect): string {
    return this.mapper.displayName(user);
  }

  assertParticipant(userId: string, conversationId: string): Promise<void> {
    return this.auth.assertParticipant(userId, conversationId);
  }

  listConversations(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<ChatCursorPageDto<ChatConversationListItemDto>> {
    return this.conversations.listConversations(userId, limit, cursor);
  }

  search(userId: string, query: string): Promise<ChatSearchResultDto> {
    return this.chatSearch.search(userId, query);
  }

  searchUsersForGroup(userId: string, query: string): Promise<ChatMemberDto[]> {
    return this.chatSearch.searchUsersForGroup(userId, query);
  }

  getOrCreateDirect(
    userId: string,
    otherUserId: string,
  ): Promise<ChatConversationDetailDto> {
    return this.conversations.getOrCreateDirect(userId, otherUserId);
  }

  createGroup(
    userId: string,
    input: { name: string; handle?: string; memberIds: string[] },
  ): Promise<ChatConversationDetailDto> {
    return this.groups.createGroup(userId, input);
  }

  getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ChatConversationDetailDto> {
    return this.conversations.getConversation(userId, conversationId);
  }

  listMessages(
    userId: string,
    conversationId: string,
    limit: number,
    before?: string,
    after?: string,
  ): Promise<ChatCursorPageDto<ChatMessageDto>> {
    return this.messages.listMessages(
      userId,
      conversationId,
      limit,
      before,
      after,
    );
  }

  sendMessage(
    userId: string,
    conversationId: string,
    input: SendChatMessageDto,
  ): Promise<ChatMessageDto> {
    return this.messages.sendMessage(userId, conversationId, input);
  }

  markRead(userId: string, conversationId: string): Promise<void> {
    return this.conversations.markRead(userId, conversationId);
  }

  ackDelivered(
    userId: string,
    conversationId: string,
    messageIds: string[],
  ): Promise<{
    updatedIds: string[];
    statuses: Record<string, ChatDeliveryStatus>;
    senderByMessageId: Record<string, string>;
  }> {
    return this.messages.ackDelivered(userId, conversationId, messageIds);
  }

  openMessageAttachment(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<{
    stream: import('stream').Readable;
    contentType: string;
    fileName: string;
  }> {
    return this.attachments.openMessageAttachment(
      userId,
      conversationId,
      messageId,
    );
  }

  listAttachments(
    userId: string,
    conversationId: string,
    tab: 'media' | 'documents',
    limit: number,
    cursor?: string,
  ): Promise<
    ChatCursorPageDto<{
      id: string;
      messageId: string;
      fileName: string;
      mimeType: string;
      url: string;
      kind: AttachmentKind;
      createdAt: string;
    }>
  > {
    return this.attachments.listAttachments(
      userId,
      conversationId,
      tab,
      limit,
      cursor,
    );
  }

  getMemberProfile(
    userId: string,
    conversationId: string,
    memberUserId: string,
  ): Promise<ChatMemberProfileDto> {
    return this.attachments.getMemberProfile(
      userId,
      conversationId,
      memberUserId,
    );
  }

  updateGroupImage(
    userId: string,
    conversationId: string,
    imageUrl: string,
  ): Promise<ChatConversationDetailDto> {
    return this.groups.updateGroupImage(userId, conversationId, imageUrl);
  }

  removeGroupMember(
    adminUserId: string,
    conversationId: string,
    memberUserId: string,
  ): Promise<ChatConversationDetailDto> {
    return this.groups.removeGroupMember(
      adminUserId,
      conversationId,
      memberUserId,
    );
  }

  deleteChatForUser(userId: string, conversationId: string): Promise<void> {
    return this.conversations.deleteChatForUser(userId, conversationId);
  }

  leaveGroup(userId: string, conversationId: string): Promise<void> {
    return this.conversations.leaveGroup(userId, conversationId);
  }

  deleteGroup(adminUserId: string, conversationId: string): Promise<string[]> {
    return this.groups.deleteGroup(adminUserId, conversationId);
  }

  getConversationPreviewForUser(
    conversationId: string,
    viewerId: string,
  ): Promise<ChatConversationListItemDto | null> {
    return this.conversations.getConversationPreviewForUser(
      conversationId,
      viewerId,
    );
  }
}
