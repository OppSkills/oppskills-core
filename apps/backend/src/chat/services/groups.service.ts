import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConversationType, MessageType, prisma } from '@oppskills/db';
import type { ChatConversationDetailDto } from '@oppskills/types';
import { ChatAuthorizationService } from './chat-authorization.service';
import { USER_SELECT } from './chat.constants';
import { ChatMapper } from './chat.mapper';
import { ConversationsService } from './conversations.service';

@Injectable()
export class GroupsService {
  constructor(
    private readonly mapper: ChatMapper,
    private readonly auth: ChatAuthorizationService,
    private readonly conversations: ConversationsService,
  ) {}

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
        ? this.mapper.displayName(creator.user)
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

    return await this.conversations.toDetail(conversation, userId);
  }

  async updateGroupImage(
    userId: string,
    conversationId: string,
    imageUrl: string,
  ): Promise<ChatConversationDetailDto> {
    await this.auth.assertParticipant(userId, conversationId);
    await this.auth.assertGroupAdmin(userId, conversationId);

    const conversation = await prisma.conversationEntity.update({
      where: { id: conversationId },
      data: { imageUrl: imageUrl.trim() },
      include: {
        participants: { include: { user: { select: USER_SELECT } } },
      },
    });

    return await this.conversations.toDetail(conversation, userId);
  }

  async removeGroupMember(
    adminUserId: string,
    conversationId: string,
    memberUserId: string,
  ): Promise<ChatConversationDetailDto> {
    await this.auth.assertParticipant(adminUserId, conversationId);
    await this.auth.assertGroupAdmin(adminUserId, conversationId);

    if (memberUserId === adminUserId) {
      throw new BadRequestException('Cannot remove the group admin');
    }

    const participant = await prisma.conversationParticipantEntity.findUnique({
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
    const removedName = this.mapper.displayName(participant.user);
    const adminName = admin ? this.mapper.displayName(admin) : 'Admin';

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
    return await this.conversations.toDetail(conversation, adminUserId);
  }

  async deleteGroup(
    adminUserId: string,
    conversationId: string,
  ): Promise<string[]> {
    await this.auth.assertParticipant(adminUserId, conversationId);
    await this.auth.assertGroupAdmin(adminUserId, conversationId);

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
}
