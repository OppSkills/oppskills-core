import { Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { prisma } from '@oppskills/db';
import type { ChatMemberDto, ChatUserPresenceDto } from '@oppskills/types';
import { Logger } from 'src/_utils/logger';
import { CacheService } from 'src/common/cache.service';

/** User is online while this key exists; refreshed on connect and heartbeat. */
const ONLINE_TTL_MS = 90_000;

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly cacheService: CacheService) {}

  private redis(): Redis | null {
    return this.cacheService.tryGetClient();
  }

  private socketsKey(userId: string) {
    return `chat:presence:sockets:${userId}`;
  }

  private onlineKey(userId: string) {
    return `chat:presence:online:${userId}`;
  }

  private lastSeenKey(userId: string) {
    return `chat:presence:lastseen:${userId}`;
  }

  async onSocketConnected(
    userId: string,
    socketId: string,
  ): Promise<{ becameOnline: boolean }> {
    const redis = this.redis();
    if (!redis) return { becameOnline: false };

    try {
      const wasOnline = (await redis.exists(this.onlineKey(userId))) === 1;
      await redis.hset(this.socketsKey(userId), socketId, '1');
      await redis.pexpire(this.socketsKey(userId), ONLINE_TTL_MS * 3);
      await redis.set(this.onlineKey(userId), '1', 'PX', ONLINE_TTL_MS);
      return { becameOnline: !wasOnline };
    } catch (error) {
      this.logger.warn('presence connect failed', error);
      return { becameOnline: false };
    }
  }

  async onSocketDisconnected(
    userId: string,
    socketId: string,
  ): Promise<{ becameOffline: boolean; lastSeenAt: string | null }> {
    const redis = this.redis();
    if (!redis) return { becameOffline: false, lastSeenAt: null };

    try {
      await redis.hdel(this.socketsKey(userId), socketId);
      const remaining = await redis.hlen(this.socketsKey(userId));
      if (remaining > 0) {
        return { becameOffline: false, lastSeenAt: null };
      }

      await redis.del(this.onlineKey(userId));
      await redis.del(this.socketsKey(userId));
      const lastSeenAt = new Date().toISOString();
      await redis.set(this.lastSeenKey(userId), lastSeenAt);
      return { becameOffline: true, lastSeenAt };
    } catch (error) {
      this.logger.warn('presence disconnect failed', error);
      return { becameOffline: false, lastSeenAt: null };
    }
  }

  async refreshOnline(userId: string): Promise<void> {
    const redis = this.redis();
    if (!redis) return;

    try {
      const online = (await redis.exists(this.onlineKey(userId))) === 1;
      if (!online) return;
      await redis.set(this.onlineKey(userId), '1', 'PX', ONLINE_TTL_MS);
    } catch (error) {
      this.logger.warn('presence heartbeat failed', error);
    }
  }

  async getPresence(userId: string): Promise<ChatUserPresenceDto> {
    const redis = this.redis();
    if (!redis) {
      return { isOnline: false, lastSeenAt: null };
    }

    try {
      const isOnline = (await redis.exists(this.onlineKey(userId))) === 1;
      const lastSeenRaw = await redis.get(this.lastSeenKey(userId));
      return {
        isOnline,
        lastSeenAt: lastSeenRaw,
      };
    } catch (error) {
      this.logger.warn('presence get failed', error);
      return { isOnline: false, lastSeenAt: null };
    }
  }

  async getPresenceMap(
    userIds: string[],
  ): Promise<Map<string, ChatUserPresenceDto>> {
    const unique = [...new Set(userIds)];
    const map = new Map<string, ChatUserPresenceDto>();
    if (unique.length === 0) return map;

    const redis = this.redis();
    if (!redis) {
      for (const id of unique) {
        map.set(id, { isOnline: false, lastSeenAt: null });
      }
      return map;
    }

    try {
      const pipeline = redis.pipeline();
      for (const id of unique) {
        pipeline.exists(this.onlineKey(id));
        pipeline.get(this.lastSeenKey(id));
      }
      const results = await pipeline.exec();
      if (!results) return map;

      for (let i = 0; i < unique.length; i++) {
        const id = unique[i];
        const existsResult = results[i * 2];
        const lastSeenResult = results[i * 2 + 1];
        const isOnline = existsResult?.[1] === 1 || existsResult?.[1] === '1';
        const lastSeenAt =
          typeof lastSeenResult?.[1] === 'string' ? lastSeenResult[1] : null;
        map.set(id, { isOnline: Boolean(isOnline), lastSeenAt });
      }
    } catch (error) {
      this.logger.warn('presence batch get failed', error);
      for (const id of unique) {
        map.set(id, { isOnline: false, lastSeenAt: null });
      }
    }

    return map;
  }

  enrichMembers(
    members: ChatMemberDto[],
    viewerId: string,
    presenceByUserId: Map<string, ChatUserPresenceDto>,
  ): ChatMemberDto[] {
    return members.map((m) => {
      if (m.id === viewerId) return m;
      const presence = presenceByUserId.get(m.id);
      if (!presence) return m;
      return { ...m, presence };
    });
  }

  async enrichMembersForViewer(
    members: ChatMemberDto[],
    viewerId: string,
  ): Promise<ChatMemberDto[]> {
    const otherIds = members.map((m) => m.id).filter((id) => id !== viewerId);
    const presenceByUserId = await this.getPresenceMap(otherIds);
    return this.enrichMembers(members, viewerId, presenceByUserId);
  }

  /** Users who share at least one active conversation with `userId`. */
  async getSharedContactUserIds(userId: string): Promise<string[]> {
    const rows = await prisma.conversationParticipantEntity.findMany({
      where: {
        leftAt: null,
        userId: { not: userId },
        conversation: {
          participants: { some: { userId, leftAt: null } },
        },
      },
      select: { userId: true },
      distinct: ['userId'],
    });
    return rows.map((r) => r.userId);
  }

  buildPresencePayload(
    userId: string,
    presence: ChatUserPresenceDto,
  ): { userId: string; isOnline: boolean; lastSeenAt: string | null } {
    return {
      userId,
      isOnline: presence.isOnline,
      lastSeenAt: presence.lastSeenAt,
    };
  }
}
