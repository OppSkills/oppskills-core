import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType, MessageType, prisma } from '@oppskills/db';
import type {
  ChatConversationDetailDto,
  ChatConversationListItemDto,
  ChatCursorPageDto,
} from '@oppskills/types';
import { PresenceService } from '../presence.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { USER_SELECT } from './chat.constants';
import type { UserSelect } from './chat.constants';
import { ChatMapper } from './chat.mapper';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly mapper: ChatMapper,
    private readonly auth: ChatAuthorizationService,
    private readonly presenceService: PresenceService,
  ) {}

  async listConversations(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<ChatCursorPageDto<ChatConversationListItemDto>> {
    const take = limit + 1;
    const conversations = await prisma.conversationEntity.findMany({
      where: {
        participants: { some: { userId, leftAt: null } },
      },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: {
          include: { user: { select: USER_SELECT } },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { sender: { select: USER_SELECT } },
        },
      },
    });

    const hasMore = conversations.length > limit;
    if (hasMore) conversations.pop();

    const parts = await prisma.conversationParticipantEntity.findMany({
      where: {
        userId,
        conversationId: { in: conversations.map((c) => c.id) },
      },
    });
    const partMap = new Map(parts.map((p) => [p.conversationId, p]));

    const data = await Promise.all(
      conversations.map((c) => this.toListItem(c, partMap.get(c.id)!, userId)),
    );

    return {
      data,
      hasMore,
      nextCursor: hasMore ? conversations[conversations.length - 1].id : null,
    };
  }

  async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ChatConversationDetailDto> {
    await this.auth.assertParticipant(userId, conversationId);
    const conversation = await prisma.conversationEntity.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return await this.toDetail(conversation, userId);
  }

  async getOrCreateDirect(
    userId: string,
    otherUserId: string,
  ): Promise<ChatConversationDetailDto> {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot start a chat with yourself');
    }
    const other = await prisma.userEntity.findUnique({
      where: { id: otherUserId },
      select: USER_SELECT,
    });
    if (!other) throw new NotFoundException('User not found');

    const { low, high } = this.mapper.directPairIds(userId, otherUserId);
    const existing = await prisma.conversationDirectKeyEntity.findUnique({
      where: { userLowId_userHighId: { userLowId: low, userHighId: high } },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: USER_SELECT } } },
          },
        },
      },
    });
    if (existing) {
      await prisma.conversationParticipantEntity.updateMany({
        where: {
          conversationId: existing.conversation.id,
          userId,
          leftAt: { not: null },
        },
        data: { leftAt: null },
      });
      const refreshed = await prisma.conversationEntity.findUnique({
        where: { id: existing.conversation.id },
        include: {
          participants: { include: { user: { select: USER_SELECT } } },
        },
      });
      if (refreshed) {
        return await this.toDetail(refreshed, userId);
      }
      return await this.toDetail(existing.conversation, userId);
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversationEntity.create({
        data: {
          type: ConversationType.DIRECT,
          name: null,
          createdById: userId,
          participants: {
            create: [{ userId }, { userId: otherUserId }],
          },
          directKey: {
            create: { userLowId: low, userHighId: high },
          },
        },
        include: {
          participants: { include: { user: { select: USER_SELECT } } },
        },
      });
      return conv;
    });

    return await this.toDetail(conversation, userId);
  }

  async deleteChatForUser(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    await this.auth.assertParticipant(userId, conversationId);
    await prisma.conversationParticipantEntity.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { leftAt: new Date() },
    });
  }

  async leaveGroup(userId: string, conversationId: string): Promise<void> {
    await this.auth.assertParticipant(userId, conversationId);
    const conv = await prisma.conversationEntity.findUnique({
      where: { id: conversationId },
      select: { type: true, createdById: true },
    });
    if (!conv || conv.type !== ConversationType.GROUP) {
      throw new BadRequestException('Not a group conversation');
    }
    if (conv.createdById === userId) {
      throw new BadRequestException(
        'Group admin cannot leave. Delete the group instead.',
      );
    }

    const user = await prisma.userEntity.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    const name = user ? this.mapper.displayName(user) : 'A member';

    await prisma.$transaction(async (tx) => {
      await tx.conversationParticipantEntity.update({
        where: {
          conversationId_userId: { conversationId, userId },
        },
        data: { leftAt: new Date() },
      });
      await tx.messageEntity.create({
        data: {
          conversationId,
          senderId: userId,
          type: MessageType.SYSTEM,
          body: `${name} left the group.`,
        },
      });
      await tx.conversationEntity.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });
    });
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    await this.auth.assertParticipant(userId, conversationId);
    await prisma.conversationParticipantEntity.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    });
  }

  async getConversationPreviewForUser(
    conversationId: string,
    viewerId: string,
  ): Promise<ChatConversationListItemDto | null> {
    const part = await prisma.conversationParticipantEntity.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: viewerId },
      },
      include: {
        conversation: {
          include: {
            participants: { include: { user: { select: USER_SELECT } } },
            messages: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: { sender: { select: USER_SELECT } },
            },
          },
        },
      },
    });
    if (!part || part.leftAt) return null;
    return this.toListItem(part.conversation, part, viewerId);
  }

  async toListItem(
    conversation: {
      id: string;
      type: ConversationType;
      name: string | null;
      handle: string | null;
      imageUrl: string | null;
      createdById: string;
      participants: {
        user: UserSelect;
        lastReadAt: Date | null;
        leftAt?: Date | null;
      }[];
      messages: Array<{
        id: string;
        senderId: string;
        type: MessageType;
        body: string | null;
        createdAt: Date;
        sender: UserSelect;
      }>;
    },
    participation: { lastReadAt: Date | null },
    viewerId: string,
  ): Promise<ChatConversationListItemDto> {
    const last = conversation.messages[0];
    const unread = await this.unreadCount(
      conversation.id,
      viewerId,
      participation.lastReadAt,
    );
    const adminId = this.mapper.groupCreatedById(conversation);
    return {
      id: conversation.id,
      type: conversation.type,
      name: this.mapper.conversationDisplayName(conversation, viewerId),
      imageUrl: this.mapper.conversationImage(conversation, viewerId),
      handle: conversation.handle,
      isGroup: conversation.type === ConversationType.GROUP,
      createdById: adminId,
      unreadCount: unread,
      lastMessage: last
        ? {
            id: last.id,
            senderId: last.senderId,
            senderName: this.mapper.displayName(last.sender),
            type: last.type,
            body: last.body,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      members: await this.presenceService.enrichMembersForViewer(
        this.auth
          .activeParticipants(conversation.participants)
          .map((p) => this.mapper.mapMember(p.user, adminId)),
        viewerId,
      ),
    };
  }

  async toDetail(
    conversation: {
      id: string;
      type: ConversationType;
      name: string | null;
      handle: string | null;
      imageUrl: string | null;
      createdById: string;
      createdAt: Date;
      participants: { user: UserSelect; leftAt?: Date | null }[];
    },
    viewerId: string,
  ): Promise<ChatConversationDetailDto> {
    const adminId = this.mapper.groupCreatedById(conversation);
    const active = this.auth.activeParticipants(conversation.participants);
    const members = await this.presenceService.enrichMembersForViewer(
      active.map((p) => this.mapper.mapMember(p.user, adminId)),
      viewerId,
    );
    return {
      id: conversation.id,
      type: conversation.type,
      name: this.mapper.conversationDisplayName(conversation, viewerId),
      imageUrl: this.mapper.conversationImage(conversation, viewerId),
      handle: conversation.handle,
      isGroup: conversation.type === ConversationType.GROUP,
      createdById: adminId,
      members,
      createdAt: conversation.createdAt.toISOString(),
    };
  }

  private async unreadCount(
    conversationId: string,
    userId: string,
    lastReadAt: Date | null,
  ): Promise<number> {
    return prisma.messageEntity.count({
      where: {
        conversationId,
        senderId: { not: userId },
        ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
      },
    });
  }
}
