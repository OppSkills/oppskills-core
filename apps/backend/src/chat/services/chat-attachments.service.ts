import { Injectable, NotFoundException } from '@nestjs/common';
import { AttachmentKind, prisma } from '@oppskills/db';
import type { ChatCursorPageDto, ChatMemberProfileDto } from '@oppskills/types';
import type { ObjectByteRange } from '../../media/media.service';
import { MediaService } from '../../media/media.service';
import { ChatAuthorizationService } from './chat-authorization.service';
import { USER_SELECT } from './chat.constants';

@Injectable()
export class ChatAttachmentsService {
  constructor(
    private readonly auth: ChatAuthorizationService,
    private readonly mediaService: MediaService,
  ) {}

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
    await this.auth.assertParticipant(userId, conversationId);
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

  async getAttachmentMetadata(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<{
    contentType: string;
    fileName: string;
    totalSize: number;
  }> {
    await this.auth.assertParticipant(userId, conversationId);

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
    const metadata = await this.mediaService.getObjectMetadata(key);

    return {
      contentType: message.attachment.mimeType || metadata.contentType,
      fileName: message.attachment.fileName,
      totalSize: metadata.contentLength,
    };
  }

  async openMessageAttachment(
    userId: string,
    conversationId: string,
    messageId: string,
    byteRange?: ObjectByteRange,
  ): Promise<{
    stream: import('stream').Readable;
    contentType: string;
    fileName: string;
    contentLength: number;
    totalSize: number;
    contentRange?: string;
    statusCode: 200 | 206;
  }> {
    await this.auth.assertParticipant(userId, conversationId);

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
    const result = await this.mediaService.getObjectStream(key, byteRange);

    return {
      stream: result.body,
      contentType: message.attachment.mimeType || result.contentType,
      fileName: message.attachment.fileName,
      contentLength: result.contentLength,
      totalSize: result.totalSize,
      contentRange: result.contentRange,
      statusCode: result.statusCode,
    };
  }

  async openMessageThumbnail(
    userId: string,
    conversationId: string,
    messageId: string,
  ): Promise<{
    stream: import('stream').Readable;
    contentType: string;
    fileName: string;
    contentLength: number;
    totalSize: number;
    statusCode: 200;
  }> {
    await this.auth.assertParticipant(userId, conversationId);

    const message = await prisma.messageEntity.findFirst({
      where: { id: messageId, conversationId },
      include: { attachment: true },
    });

    if (!message?.attachment?.thumbnailUrl) {
      throw new NotFoundException('Thumbnail not found');
    }

    const key = this.mediaService.resolveObjectKeyFromStoredUrl(
      message.attachment.thumbnailUrl,
    );
    this.mediaService.assertChatAttachmentKey(key);
    const result = await this.mediaService.getObjectStream(key);

    return {
      stream: result.body,
      contentType: 'image/jpeg',
      fileName: 'thumbnail.jpg',
      contentLength: result.contentLength,
      totalSize: result.totalSize,
      statusCode: 200,
    };
  }

  async getMemberProfile(
    userId: string,
    conversationId: string,
    memberUserId: string,
  ): Promise<ChatMemberProfileDto> {
    await this.auth.assertParticipant(userId, conversationId);
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
}
