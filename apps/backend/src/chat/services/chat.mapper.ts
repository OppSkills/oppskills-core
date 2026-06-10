import { Injectable } from '@nestjs/common';
import { ConversationType } from '@oppskills/db';
import type { ChatMemberDto } from '@oppskills/types';
import type { UserSelect } from './chat.constants';

@Injectable()
export class ChatMapper {
  displayName(user: UserSelect): string {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
    const local = user.email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  mapMember(
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

  groupCreatedById(conversation: {
    type: ConversationType;
    createdById: string;
  }): string | null {
    return conversation.type === ConversationType.GROUP
      ? conversation.createdById
      : null;
  }

  conversationDisplayName(
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
    const other = conversation.participants.find((p) => p.user.id !== viewerId);
    return other ? this.displayName(other.user) : 'Chat';
  }

  conversationImage(
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

  directPairIds(a: string, b: string): { low: string; high: string } {
    return a < b ? { low: a, high: b } : { low: b, high: a };
  }
}
