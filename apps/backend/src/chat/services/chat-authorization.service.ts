import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConversationType, prisma } from '@oppskills/db';

@Injectable()
export class ChatAuthorizationService {
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

  activeParticipants<T extends { leftAt?: Date | null }>(
    participants: T[],
  ): T[] {
    return participants.filter((p) => !p.leftAt);
  }

  async assertGroupAdmin(
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

  async activeParticipantIds(conversationId: string): Promise<string[]> {
    const rows = await prisma.conversationParticipantEntity.findMany({
      where: { conversationId, leftAt: null },
      select: { userId: true },
    });
    return rows.map((r) => r.userId);
  }

  otherParticipantIdsFromActive(
    activeParticipantIds: string[],
    excludeUserId: string,
  ): string[] {
    return activeParticipantIds.filter((id) => id !== excludeUserId);
  }

  async otherParticipantIds(
    conversationId: string,
    excludeUserId: string,
    activeParticipantIds?: string[],
  ): Promise<string[]> {
    const active =
      activeParticipantIds ?? (await this.activeParticipantIds(conversationId));
    return this.otherParticipantIdsFromActive(active, excludeUserId);
  }

  async restoreConversationForParticipants(
    conversationId: string,
    tx?: Pick<typeof prisma, 'conversationParticipantEntity'>,
  ): Promise<void> {
    const client = tx ?? prisma;
    await client.conversationParticipantEntity.updateMany({
      where: { conversationId, leftAt: { not: null } },
      data: { leftAt: null },
    });
  }
}
