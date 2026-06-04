import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AttachmentKind,
  ConversationType,
  MessageType,
  prisma,
} from '@oppskills/db';
import type {
  ChatAttachmentDto,
  ChatConversationDetailDto,
  ChatConversationListItemDto,
  ChatCursorPageDto,
  ChatDeliveryStatus,
  ChatMemberDto,
  ChatMemberProfileDto,
  ChatMessageDto,
  ChatSearchResultDto,
} from '@oppskills/types';
import { sanitizeHtmlContent } from 'src/_utils/html-sanitizer.utils';
import { Logger } from 'src/_utils/logger';
import { MediaService } from '../media/media.service';
import { PresenceService } from './presence.service';
import type { SendChatMessageDto } from './dto/chat.dto';

type UserSelect = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
};

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  imageUrl: true,
} as const;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly mediaService: MediaService,
    private readonly presenceService: PresenceService,
  ) {}

  displayName(user: UserSelect): string {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    const local = user.email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  private directPairIds(a: string, b: string): { low: string; high: string } {
    return a < b ? { low: a, high: b } : { low: b, high: a };
  }

  async assertParticipant(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const row = await prisma.conversationParticipantEntity.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    if (!row || row.leftAt) {
      throw new ForbiddenException('Not a participant of this conversation');
    }
  }

  private activeParticipants<T extends { leftAt?: Date | null }>(
    participants: T[],
  ): T[] {
    return participants.filter((p) => !p.leftAt);
  }

  private async restoreConversationForParticipants(
    conversationId: string,
    tx?: Pick<typeof prisma, 'conversationParticipantEntity'>,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.conversationParticipantEntity.updateMany({
      where: { conversationId, leftAt: { not: null } },
      data: { leftAt: null },
    });
  }

  private mapMember(
    user: UserSelect,
    createdById: string | null = null,
  ): ChatMemberDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      isAdmin: createdById !== null && user.id === createdById,
    };
  }

  private groupCreatedById(
    conversation: { type: ConversationType; createdById: string },
  ): string | null {
    return conversation.type === ConversationType.GROUP
      ? conversation.createdById
      : null;
  }

  private async assertGroupAdmin(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    const conv = await prisma.conversationEntity.findUnique({
      where: { id: conversationId },
      select: { type: true, createdById: true },
    });
    if (!conv || conv.type !== ConversationType.GROUP) {
      throw new BadRequestException('Not a group conversation');
    }
    if (conv.createdById !== userId) {
      throw new ForbiddenException(
        'Only the group admin can perform this action',
      );
    }
  }

  private async otherParticipantIds(
    conversationId: string,
    excludeUserId: string,
  ): Promise<string[]> {
    const rows = await prisma.conversationParticipantEntity.findMany({
      where: {
        conversationId,
        userId: { not: excludeUserId },
      },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  private async computeDeliveryStatus(
    messageId: string,
    senderId: string,
    conversationId: string,
    viewerId: string,
  ): Promise<ChatDeliveryStatus | null> {
    if (viewerId !== senderId) return null;
    const others = await this.otherParticipantIds(conversationId, senderId);
    if (others.length === 0) return 'DELIVERED';
    const delivered = await prisma.messageDeliveryEntity.count({
      where: {
        messageId,
        userId: { in: others },
      },
    });
    return delivered >= others.length ? 'DELIVERED' : 'SENT';
  }

  private async mapMessage(
    message: {
      id: string;
      conversationId: string;
      senderId: string;
      type: MessageType;
      body: string | null;
      createdAt: Date;
      sender: UserSelect;
      replyTo: {
        id: string;
        body: string | null;
        sender: UserSelect;
      } | null;
      attachment: {
        fileName: string;
        mimeType: string;
        sizeBytes: number | null;
        url: string;
        kind: AttachmentKind;
      } | null;
    },
    viewerId: string,
  ): Promise<ChatMessageDto> {
    const deliveryStatus = await this.computeDeliveryStatus(
      message.id,
      message.senderId,
      message.conversationId,
      viewerId,
    );
    let attachment: ChatAttachmentDto | null = null;
    if (message.attachment) {
      attachment = {
        fileName: message.attachment.fileName,
        mimeType: message.attachment.mimeType,
        sizeBytes: message.attachment.sizeBytes,
        url: message.attachment.url,
        kind: message.attachment.kind,
      };
    }
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: this.displayName(message.sender),
      type: message.type,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      replyTo: message.replyTo
        ? {
            messageId: message.replyTo.id,
            senderName: this.displayName(message.replyTo.sender),
            text: message.replyTo.body ?? '',
          }
        : null,
      attachment,
      deliveryStatus,
    };
  }

  private messageInclude = {
    sender: { select: USER_SELECT },
    replyTo: {
      select: {
        id: true,
        body: true,
        sender: { select: USER_SELECT },
      },
    },
    attachment: true,
  } as const;

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
      conversations.map((c) =>
        this.toListItem(c, partMap.get(c.id)!, userId),
      ),
    );

    return {
      data,
      hasMore,
      nextCursor: hasMore ? conversations[conversations.length - 1].id : null,
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

  private conversationDisplayName(
    conversation: {
      type: ConversationType;
      name: string | null;
      participants: { user: UserSelect }[];
    },
    viewerId: string,
  ): string {
    if (conversation.type === ConversationType.GROUP) {
      return conversation.name ?? 'Group';
    }
    const other = conversation.participants.find(
      (p) => p.user.id !== viewerId,
    );
    return other ? this.displayName(other.user) : 'Chat';
  }

  private conversationImage(
    conversation: {
      type: ConversationType;
      imageUrl: string | null;
      participants: { user: UserSelect }[];
    },
    viewerId: string,
  ): string | null {
    if (conversation.imageUrl) return conversation.imageUrl;
    if (conversation.type === ConversationType.DIRECT) {
      const other = conversation.participants.find(
        (p) => p.user.id !== viewerId,
      );
      return other?.user.imageUrl ?? null;
    }
    return null;
  }

  private async toListItem(
    conversation: {
      id: string;
      type: ConversationType;
      name: string | null;
      handle: string | null;
      imageUrl: string | null;
      createdById: string;
      participants: { user: UserSelect; lastReadAt: Date | null; leftAt?: Date | null }[];
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
    const adminId = this.groupCreatedById(conversation);
    return {
      id: conversation.id,
      type: conversation.type,
      name: this.conversationDisplayName(conversation, viewerId),
      imageUrl: this.conversationImage(conversation, viewerId),
      handle: conversation.handle,
      isGroup: conversation.type === ConversationType.GROUP,
      createdById: adminId,
      unreadCount: unread,
      lastMessage: last
        ? {
            id: last.id,
            senderId: last.senderId,
            senderName: this.displayName(last.sender),
            type: last.type,
            body: last.body,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      members: await this.presenceService.enrichMembersForViewer(
        this.activeParticipants(conversation.participants).map((p) =>
          this.mapMember(p.user, adminId),
        ),
        viewerId,
      ),
    };
  }

  async search(userId: string, query: string): Promise<ChatSearchResultDto> {
    const q = query.trim();
    if (q.length === 0) {
      return { conversations: [], users: [] };
    }
    const myParticipations =
      await prisma.conversationParticipantEntity.findMany({
        where: { userId, leftAt: null },
        select: { conversationId: true },
      });
    const myConvIds = myParticipations.map((p) => p.conversationId);

    let conversations: ChatConversationListItemDto[] = [];
    if (myConvIds.length > 0) {
      const convs = await prisma.conversationEntity.findMany({
        where: {
          id: { in: myConvIds },
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { handle: { contains: q, mode: 'insensitive' } },
            {
              participants: {
                some: {
                  user: {
                    OR: [
                      { email: { contains: q, mode: 'insensitive' } },
                      { firstName: { contains: q, mode: 'insensitive' } },
                      { lastName: { contains: q, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            },
            {
              messages: {
                some: { body: { contains: q, mode: 'insensitive' } },
              },
            },
          ],
        },
        take: 20,
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

      const parts = await prisma.conversationParticipantEntity.findMany({
        where: {
          userId,
          conversationId: { in: convs.map((c) => c.id) },
        },
      });
      const partMap = new Map(parts.map((p) => [p.conversationId, p]));

      conversations = await Promise.all(
        convs.map((c) =>
          this.toListItem(c, partMap.get(c.id)!, userId),
        ),
      );
    }

    const dmOtherIds = new Set<string>();
    if (myConvIds.length > 0) {
      const dms = await prisma.conversationEntity.findMany({
        where: {
          id: { in: myConvIds },
          type: ConversationType.DIRECT,
        },
        include: {
          participants: { select: { userId: true } },
        },
      });
      for (const dm of dms) {
        for (const p of dm.participants) {
          if (p.userId !== userId) dmOtherIds.add(p.userId);
        }
      }
    }

    const users = await prisma.userEntity.findMany({
      where: {
        id: { not: userId, notIn: [...dmOtherIds] },
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: USER_SELECT,
      take: 15,
      orderBy: { email: 'asc' },
    });

    return {
      conversations,
      users: users.map((u) => this.mapMember(u)),
    };
  }

  /** Search all platform users (for group member picker). Excludes only self. */
  async searchUsersForGroup(
    userId: string,
    query: string,
  ): Promise<ChatMemberDto[]> {
    const q = query.trim();
    if (q.length === 0) {
      return [];
    }
    const users = await prisma.userEntity.findMany({
      where: {
        id: { not: userId },
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: USER_SELECT,
      take: 20,
      orderBy: { email: 'asc' },
    });
    return users.map((u) => this.mapMember(u));
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

    const { low, high } = this.directPairIds(userId, otherUserId);
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

  async createGroup(
    userId: string,
    input: { name: string; handle?: string; memberIds: string[] },
  ): Promise<ChatConversationDetailDto> {
    const uniqueMembers = [...new Set(input.memberIds)].filter(
      (id) => id !== userId,
    );
    if (uniqueMembers.length === 0) {
      throw new BadRequestException('Select at least one member');
    }
    if (input.handle) {
      const taken = await prisma.conversationEntity.findUnique({
        where: { handle: input.handle },
      });
      if (taken) throw new BadRequestException('Group handle already taken');
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversationEntity.create({
        data: {
          type: ConversationType.GROUP,
          name: input.name.trim(),
          handle: input.handle?.trim() || null,
          createdById: userId,
          participants: {
            create: [
              { userId },
              ...uniqueMembers.map((id) => ({ userId: id })),
            ],
          },
        },
        include: {
          participants: { include: { user: { select: USER_SELECT } } },
        },
      });

      const creator = conv.participants.find((p) => p.user.id === userId);
      const creatorName = creator
        ? this.displayName(creator.user)
        : 'Someone';

      await tx.messageEntity.create({
        data: {
          conversationId: conv.id,
          senderId: userId,
          type: MessageType.SYSTEM,
          body: `Group "${input.name.trim()}" created by ${creatorName}.`,
        },
      });

      await tx.conversationEntity.update({
        where: { id: conv.id },
        data: { lastMessageAt: new Date() },
      });

      return conv;
    });

    return await this.toDetail(conversation, userId);
  }

  private async toDetail(
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
    const adminId = this.groupCreatedById(conversation);
    const active = this.activeParticipants(conversation.participants);
    const members = await this.presenceService.enrichMembersForViewer(
      active.map((p) => this.mapMember(p.user, adminId)),
      viewerId,
    );
    return {
      id: conversation.id,
      type: conversation.type,
      name: this.conversationDisplayName(conversation, viewerId),
      imageUrl: this.conversationImage(conversation, viewerId),
      handle: conversation.handle,
      isGroup: conversation.type === ConversationType.GROUP,
      createdById: adminId,
      members,
      createdAt: conversation.createdAt.toISOString(),
    };
  }

  async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ChatConversationDetailDto> {
    await this.assertParticipant(userId, conversationId);
    const conversation = await prisma.conversationEntity.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
      },
    });
    if (!conversation) throw new NotFoundException('Conversation not found');
    return await this.toDetail(conversation, userId);
  }

  async listMessages(
    userId: string,
    conversationId: string,
    limit: number,
    before?: string,
    after?: string,
  ): Promise<ChatCursorPageDto<ChatMessageDto>> {
    await this.assertParticipant(userId, conversationId);

    if (before && after) {
      throw new BadRequestException('Use either before or after, not both');
    }

    const take = limit + 1;

    if (after) {
      const messages = await prisma.messageEntity.findMany({
        where: { conversationId },
        take,
        skip: 1,
        cursor: { id: after },
        orderBy: { createdAt: 'asc' },
        include: this.messageInclude,
      });
      const hasMore = messages.length > limit;
      if (hasMore) messages.pop();
      const data = await Promise.all(
        messages.map((m) => this.mapMessage(m, userId)),
      );
      await this.ackDelivered(userId, conversationId, data.map((m) => m.id));
      return {
        data,
        hasMore,
        nextCursor: hasMore ? messages[messages.length - 1].id : null,
      };
    }

    const messages = await prisma.messageEntity.findMany({
      where: { conversationId },
      take,
      skip: before ? 1 : 0,
      cursor: before ? { id: before } : undefined,
      orderBy: { createdAt: 'desc' },
      include: this.messageInclude,
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    const chronological = [...messages].reverse();
    const data = await Promise.all(
      chronological.map((m) => this.mapMessage(m, userId)),
    );
    const ids = data.map((m) => m.id);
    await this.ackDelivered(userId, conversationId, ids);

    return {
      data,
      hasMore,
      nextCursor: hasMore ? messages[messages.length - 1].id : null,
    };
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    input: SendChatMessageDto,
  ): Promise<ChatMessageDto> {
    await this.assertParticipant(userId, conversationId);

    const type = input.type ?? MessageType.TEXT;
    let body: string | null =
      typeof input.body === 'string' ? sanitizeHtmlContent(input.body) : null;

    if (type === MessageType.TEXT && (!body || body.trim().length === 0)) {
      throw new BadRequestException('Message body is required');
    }

    if (input.replyToMessageId) {
      const reply = await prisma.messageEntity.findFirst({
        where: {
          id: input.replyToMessageId,
          conversationId,
        },
      });
      if (!reply) throw new BadRequestException('Invalid reply target');
    }

    let attachmentKind: AttachmentKind | undefined;
    if (input.attachment) {
      attachmentKind = input.attachment.kind as AttachmentKind;
      if (!body) {
        body =
          input.attachment.kind === 'IMAGE'
            ? ''
            : input.attachment.fileName;
      }
    }

    const message = await prisma.$transaction(async (tx) => {
      await this.restoreConversationForParticipants(conversationId, tx);
      const created = await tx.messageEntity.create({
        data: {
          conversationId,
          senderId: userId,
          type: type as MessageType,
          body,
          replyToMessageId: input.replyToMessageId ?? null,
          ...(input.attachment
            ? {
                attachment: {
                  create: {
                    fileName: input.attachment.fileName,
                    mimeType: input.attachment.mimeType,
                    sizeBytes: input.attachment.sizeBytes ?? null,
                    url: input.attachment.url,
                    kind: attachmentKind!,
                  },
                },
              }
            : {}),
        },
        include: this.messageInclude,
      });

      await tx.conversationEntity.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    return this.mapMessage(message, userId);
  }

  async markRead(userId: string, conversationId: string): Promise<void> {
    await this.assertParticipant(userId, conversationId);
    await prisma.conversationParticipantEntity.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { lastReadAt: new Date() },
    });
  }

  async ackDelivered(
    userId: string,
    conversationId: string,
    messageIds: string[],
  ): Promise<{ updatedIds: string[]; statuses: Record<string, ChatDeliveryStatus> }> {
    if (messageIds.length === 0) {
      return { updatedIds: [], statuses: {} };
    }
    await this.assertParticipant(userId, conversationId);

    const messages = await prisma.messageEntity.findMany({
      where: {
        id: { in: messageIds },
        conversationId,
        senderId: { not: userId },
      },
      select: { id: true, senderId: true },
    });

    if (messages.length === 0) {
      return { updatedIds: [], statuses: {} };
    }

    await prisma.messageDeliveryEntity.createMany({
      data: messages.map((m) => ({
        messageId: m.id,
        userId,
      })),
      skipDuplicates: true,
    });

    const statuses: Record<string, ChatDeliveryStatus> = {};
    for (const m of messages) {
      const status = await this.computeDeliveryStatus(
        m.id,
        m.senderId,
        conversationId,
        m.senderId,
      );
      statuses[m.id] = status ?? 'SENT';
    }

    return {
      updatedIds: messages.map((m) => m.id),
      statuses,
    };
  }

  async openMessageAttachment(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<{
    stream: import('stream').Readable;
    contentType: string;
    fileName: string;
  }> {
    await this.assertParticipant(userId, conversationId);

    const message = await prisma.messageEntity.findFirst({
      where: { id: messageId, conversationId },
      include: { attachment: true },
    });

    if (!message?.attachment) {
      throw new NotFoundException('Attachment not found');
    }

    const key = this.mediaService.resolveObjectKeyFromStoredUrl(
      message.attachment.url,
    );
    this.mediaService.assertChatAttachmentKey(key);
    const { body, contentType } = await this.mediaService.getObjectStream(key);

    return {
      stream: body,
      contentType: message.attachment.mimeType || contentType,
      fileName: message.attachment.fileName,
    };
  }

  async listAttachments(
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
    await this.assertParticipant(userId, conversationId);
    const kinds =
      tab === 'media'
        ? ([AttachmentKind.IMAGE, AttachmentKind.VIDEO] as AttachmentKind[])
        : ([AttachmentKind.DOCUMENT] as AttachmentKind[]);

    const take = limit + 1;
    const rows = await prisma.messageAttachmentEntity.findMany({
      where: {
        kind: { in: kinds },
        message: { conversationId },
      },
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        messageId: true,
        fileName: true,
        mimeType: true,
        url: true,
        kind: true,
        createdAt: true,
      },
    });

    const hasMore = rows.length > limit;
    if (hasMore) rows.pop();

    return {
      data: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
      hasMore,
      nextCursor: hasMore ? rows[rows.length - 1].id : null,
    };
  }

  async getMemberProfile(
    userId: string,
    conversationId: string,
    memberUserId: string,
  ): Promise<ChatMemberProfileDto> {
    await this.assertParticipant(userId, conversationId);
    const memberPart = await prisma.conversationParticipantEntity.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: memberUserId,
        },
      },
    });
    if (!memberPart) {
      throw new NotFoundException('Member not in this conversation');
    }

    const user = await prisma.userEntity.findUnique({
      where: { id: memberUserId },
      select: {
        ...USER_SELECT,
        onboardingProfile: {
          select: {
            skills: true,
            interests: true,
            college: { select: { name: true } },
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      skills: user.onboardingProfile?.skills ?? [],
      interests: user.onboardingProfile?.interests ?? [],
      collegeName: user.onboardingProfile?.college?.name ?? null,
    };
  }

  async updateGroupImage(
    userId: string,
    conversationId: string,
    imageUrl: string,
  ): Promise<ChatConversationDetailDto> {
    await this.assertParticipant(userId, conversationId);
    await this.assertGroupAdmin(userId, conversationId);

    const conversation = await prisma.conversationEntity.update({
      where: { id: conversationId },
      data: { imageUrl: imageUrl.trim() },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
      },
    });

    return await this.toDetail(conversation, userId);
  }

  async removeGroupMember(
    adminUserId: string,
    conversationId: string,
    memberUserId: string,
  ): Promise<ChatConversationDetailDto> {
    await this.assertParticipant(adminUserId, conversationId);
    await this.assertGroupAdmin(adminUserId, conversationId);

    if (memberUserId === adminUserId) {
      throw new BadRequestException('Cannot remove the group admin');
    }

    const participant =
      await prisma.conversationParticipantEntity.findUnique({
        where: {
          conversationId_userId: {
            conversationId,
            userId: memberUserId,
          },
        },
        include: { user: { select: USER_SELECT } },
      });
    if (!participant) {
      throw new NotFoundException('Member not in this group');
    }

    const admin = await prisma.userEntity.findUnique({
      where: { id: adminUserId },
      select: USER_SELECT,
    });
    const removedName = this.displayName(participant.user);
    const adminName = admin ? this.displayName(admin) : 'Admin';

    await prisma.$transaction(async (tx) => {
      await tx.conversationParticipantEntity.delete({
        where: { id: participant.id },
      });
      await tx.messageEntity.create({
        data: {
          conversationId,
          senderId: adminUserId,
          type: MessageType.SYSTEM,
          body: `${removedName} was removed by ${adminName}.`,
        },
      });
      await tx.conversationEntity.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() },
      });
    });

    const conversation = await prisma.conversationEntity.findUnique({
      where: { id: conversationId },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
      },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return await this.toDetail(conversation, adminUserId);
  }

  /** Hide chat from inbox (DM or group). Restored when a new message arrives. */
  async deleteChatForUser(
    userId: string,
    conversationId: string,
  ): Promise<void> {
    await this.assertParticipant(userId, conversationId);
    await prisma.conversationParticipantEntity.update({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      data: { leftAt: new Date() },
    });
  }

  /** Member leaves a group (not available to admin — admin deletes the group). */
  async leaveGroup(userId: string, conversationId: string): Promise<void> {
    await this.assertParticipant(userId, conversationId);
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
    const name = user ? this.displayName(user) : 'A member';

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

  /** Admin deletes the group for all members. */
  async deleteGroup(
    adminUserId: string,
    conversationId: string,
  ): Promise<string[]> {
    await this.assertParticipant(adminUserId, conversationId);
    await this.assertGroupAdmin(adminUserId, conversationId);

    const participants = await prisma.conversationParticipantEntity.findMany({
      where: { conversationId },
      select: { userId: true },
    });
    const userIds = participants.map((p) => p.userId);

    await prisma.conversationEntity.delete({
      where: { id: conversationId },
    });

    return userIds;
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
}
