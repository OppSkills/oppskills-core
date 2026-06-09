import { Injectable } from '@nestjs/common';
import { ConversationType, prisma } from '@oppskills/db';
import type { ChatMemberDto, ChatSearchResultDto } from '@oppskills/types';
import { USER_SELECT } from './chat.constants';
import { ChatMapper } from './chat.mapper';
import { ConversationsService } from './conversations.service';

@Injectable()
export class ChatSearchService {
  constructor(
    private readonly mapper: ChatMapper,
    private readonly conversations: ConversationsService,
  ) {}

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

    let conversations: ChatSearchResultDto['conversations'] = [];
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
          this.conversations.toListItem(c, partMap.get(c.id)!, userId),
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
      users: users.map((u) => this.mapper.mapMember(u)),
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
    return users.map((u) => this.mapper.mapMember(u));
  }
}
