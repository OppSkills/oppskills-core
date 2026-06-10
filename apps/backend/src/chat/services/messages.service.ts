import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AttachmentKind,
  MessageType,
  prisma,
} from '@oppskills/db';
import type {
  ChatAttachmentDto,
  ChatCursorPageDto,
  ChatDeliveryStatus,
  ChatMessageDto,
} from '@oppskills/types';
import { sanitizeHtmlContent } from 'src/_utils/html-sanitizer.utils';
import type { SendChatMessageDto } from '../dto/chat.dto';
import { ChatAuthorizationService } from './chat-authorization.service';
import { MESSAGE_INCLUDE } from './chat.constants';
import type { UserSelect } from './chat.constants';
import { ChatMapper } from './chat.mapper';

@Injectable()
export class MessagesService {
  constructor(
    private readonly mapper: ChatMapper,
    private readonly auth: ChatAuthorizationService,
  ) {}

  async listMessages(
    userId: string,
    conversationId: string,
    limit: number,
    before?: string,
    after?: string,
  ): Promise<ChatCursorPageDto<ChatMessageDto>> {
    await this.auth.assertParticipant(userId, conversationId);

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
        include: MESSAGE_INCLUDE,
      });
      const hasMore = messages.length > limit;
      if (hasMore) messages.pop();
      const activeParticipantIds =
        await this.auth.activeParticipantIds(conversationId);
      const data = await Promise.all(
        messages.map((m) => this.mapMessage(m, userId, activeParticipantIds)),
      );
      await this.ackDelivered(
        userId,
        conversationId,
        data.map((m) => m.id),
      );
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
      include: MESSAGE_INCLUDE,
    });

    const hasMore = messages.length > limit;
    if (hasMore) messages.pop();

    const chronological = [...messages].reverse();
    const activeParticipantIds =
      await this.auth.activeParticipantIds(conversationId);
    const data = await Promise.all(
      chronological.map((m) =>
        this.mapMessage(m, userId, activeParticipantIds),
      ),
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
    await this.auth.assertParticipant(userId, conversationId);

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
          input.attachment.kind === 'IMAGE' ? '' : input.attachment.fileName;
      }
    }

    const message = await prisma.$transaction(async (tx) => {
      await this.auth.restoreConversationForParticipants(conversationId, tx);
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
        include: MESSAGE_INCLUDE,
      });

      await tx.conversationEntity.update({
        where: { id: conversationId },
        data: { lastMessageAt: created.createdAt },
      });

      return created;
    });

    return this.mapMessage(message, userId);
  }

  async getMessage(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<ChatMessageDto> {
    await this.auth.assertParticipant(userId, conversationId);
    const message = await prisma.messageEntity.findFirst({
      where: { id: messageId, conversationId },
      include: MESSAGE_INCLUDE,
    });
    if (!message) {
      throw new BadRequestException('Message not found');
    }
    return this.mapMessage(message, userId);
  }

  async ackDelivered(
    userId: string,
    conversationId: string,
    messageIds: string[],
  ): Promise<{
    updatedIds: string[];
    statuses: Record<string, ChatDeliveryStatus>;
    senderByMessageId: Record<string, string>;
  }> {
    if (messageIds.length === 0) {
      return { updatedIds: [], statuses: {}, senderByMessageId: {} };
    }
    await this.auth.assertParticipant(userId, conversationId);

    const messages = await prisma.messageEntity.findMany({
      where: {
        id: { in: messageIds },
        conversationId,
        senderId: { not: userId },
      },
      select: { id: true, senderId: true },
    });

    if (messages.length === 0) {
      return { updatedIds: [], statuses: {}, senderByMessageId: {} };
    }

    await prisma.messageDeliveryEntity.createMany({
      data: messages.map((m) => ({
        messageId: m.id,
        userId,
      })),
      skipDuplicates: true,
    });

    const activeParticipantIds =
      await this.auth.activeParticipantIds(conversationId);
    const statuses: Record<string, ChatDeliveryStatus> = {};
    for (const m of messages) {
      const status = await this.computeDeliveryStatus(
        m.id,
        m.senderId,
        conversationId,
        m.senderId,
        activeParticipantIds,
      );
      statuses[m.id] = status ?? 'SENT';
    }

    const senderByMessageId: Record<string, string> = {};
    for (const m of messages) {
      senderByMessageId[m.id] = m.senderId;
    }

    return {
      updatedIds: messages.map((m) => m.id),
      statuses,
      senderByMessageId,
    };
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
        thumbnailUrl: string | null;
        durationSeconds: number | null;
        kind: AttachmentKind;
      } | null;
    },
    viewerId: string,
    activeParticipantIds?: string[],
  ): Promise<ChatMessageDto> {
    const deliveryStatus = await this.computeDeliveryStatus(
      message.id,
      message.senderId,
      message.conversationId,
      viewerId,
      activeParticipantIds,
    );
    let attachment: ChatAttachmentDto | null = null;
    if (message.attachment) {
      attachment = {
        fileName: message.attachment.fileName,
        mimeType: message.attachment.mimeType,
        sizeBytes: message.attachment.sizeBytes,
        url: message.attachment.url,
        thumbnailUrl: message.attachment.thumbnailUrl,
        durationSeconds: message.attachment.durationSeconds,
        kind: message.attachment.kind,
      };
    }
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: this.mapper.displayName(message.sender),
      type: message.type,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      replyTo: message.replyTo
        ? {
            messageId: message.replyTo.id,
            senderName: this.mapper.displayName(message.replyTo.sender),
            text: message.replyTo.body ?? '',
          }
        : null,
      attachment,
      deliveryStatus,
    };
  }

  private async computeDeliveryStatus(
    messageId: string,
    senderId: string,
    conversationId: string,
    viewerId: string,
    activeParticipantIds?: string[],
  ): Promise<ChatDeliveryStatus | null> {
    if (viewerId !== senderId) return null;
    const others = await this.auth.otherParticipantIds(
      conversationId,
      senderId,
      activeParticipantIds,
    );
    if (others.length === 0) return 'DELIVERED';
    const delivered = await prisma.messageDeliveryEntity.count({
      where: {
        messageId,
        userId: { in: others },
      },
    });
    return delivered >= others.length ? 'DELIVERED' : 'SENT';
  }
}
