import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verifyToken } from '@clerk/backend';
import { Logger } from 'src/_utils/logger';
import { ClerkAuthConfigService } from 'src/common/config.service';
import { CacheService } from 'src/common/cache.service';
import { ChatService } from './chat.service';
import { PresenceService } from './presence.service';
import type { SendChatMessageDto } from './dto/chat.dto';
import { prisma } from '@oppskills/db';
import type { ChatConversationListItemDto, ChatMessageDto } from '@oppskills/types';

type AuthenticatedSocket = Socket & { data: { userId: string } };

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly presenceService: PresenceService,
    private readonly clerkConfig: ClerkAuthConfigService,
    private readonly cacheService: CacheService,
  ) {}

  afterInit(server: Server) {
    try {
      const pubClient = this.cacheService.tryGetClient();
      if (pubClient) {
        const subClient = pubClient.duplicate();
        server.adapter(createAdapter(pubClient, subClient));
        this.logger.debug('Socket.IO Redis adapter enabled');
      }
    } catch (error) {
      this.logger.warn('Socket.IO running without Redis adapter', error);
    }
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        this.extractBearer(client.handshake.headers.authorization);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const claims = await verifyToken(token, {
        secretKey: this.clerkConfig.clerkSecretKey,
        clockSkewInMs: 15000,
      });
      const userId = claims.sub;
      if (!userId) {
        client.disconnect(true);
        return;
      }

      client.data = { userId };
      await client.join(this.userRoom(userId));
      const { becameOnline } = await this.presenceService.onSocketConnected(
        userId,
        client.id,
      );
      if (becameOnline) {
        await this.broadcastPresenceToContacts(userId);
      }
    } catch (error) {
      this.logger.warn('Chat WS connection rejected', error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data?.userId;
    if (!userId) return;

    const { becameOffline, lastSeenAt } =
      await this.presenceService.onSocketDisconnected(userId, client.id);
    if (becameOffline) {
      await this.broadcastPresenceToContacts(userId, lastSeenAt);
    }
  }

  private extractBearer(header: string | undefined): string | undefined {
    if (!header?.startsWith('Bearer ')) return undefined;
    return header.slice(7).trim();
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  private conversationRoom(conversationId: string) {
    return `conversation:${conversationId}`;
  }

  private requireUserId(client: AuthenticatedSocket): string {
    const userId = client.data?.userId;
    if (!userId) throw new Error('Unauthenticated socket');
    return userId;
  }

  @SubscribeMessage('join_conversation')
  async joinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    const userId = this.requireUserId(client);
    const conversationId = body?.conversationId;
    if (!conversationId) return { ok: false };

    await this.chatService.assertParticipant(userId, conversationId);
    await client.join(this.conversationRoom(conversationId));
    return { ok: true };
  }

  @SubscribeMessage('leave_conversation')
  async leaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    const conversationId = body?.conversationId;
    if (!conversationId) return { ok: false };
    await client.leave(this.conversationRoom(conversationId));
    return { ok: true };
  }

  @SubscribeMessage('send_message')
  async sendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    body: { conversationId: string } & SendChatMessageDto,
  ) {
    const userId = this.requireUserId(client);
    const { conversationId, ...payload } = body;
    if (!conversationId) return { ok: false };

    const message = await this.chatService.sendMessage(
      userId,
      conversationId,
      payload,
    );

    await this.broadcastNewMessage(conversationId, message);
    return { ok: true, message };
  }

  @SubscribeMessage('presence_heartbeat')
  async presenceHeartbeat(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = this.requireUserId(client);
    await this.presenceService.refreshOnline(userId);
    return { ok: true };
  }

  private async broadcastPresenceToContacts(
    userId: string,
    lastSeenAt: string | null = null,
  ) {
    const presence =
      lastSeenAt !== null
        ? { isOnline: false, lastSeenAt }
        : await this.presenceService.getPresence(userId);
    const payload = this.presenceService.buildPresencePayload(
      userId,
      presence,
    );

    const contactIds =
      await this.presenceService.getSharedContactUserIds(userId);
    for (const contactId of contactIds) {
      this.server.to(this.userRoom(contactId)).emit('presence_updated', payload);
    }
  }

  @SubscribeMessage('ack_delivered')
  async ackDelivered(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: { conversationId: string; messageIds: string[] },
  ) {
    const userId = this.requireUserId(client);
    const { conversationId, messageIds } = body;
    if (!conversationId || !messageIds?.length) return { ok: false };

    const result = await this.chatService.ackDelivered(
      userId,
      conversationId,
      messageIds,
    );

    for (const messageId of result.updatedIds) {
      const status = result.statuses[messageId];
      const row = await prisma.messageEntity.findUnique({
        where: { id: messageId },
        select: { senderId: true },
      });
      if (row) {
        this.server.to(this.userRoom(row.senderId)).emit('messages_delivered', {
          conversationId,
          messageId,
          deliveryStatus: status,
        });
      }
    }

    return { ok: true, ...result };
  }

  async broadcastConversationRemoved(
    conversationId: string,
    userIds: string[],
  ) {
    const unique = [...new Set(userIds)];
    for (const userId of unique) {
      this.server.to(this.userRoom(userId)).emit('conversation_removed', {
        conversationId,
      });
    }
  }

  async broadcastConversationUpdated(conversationId: string) {
    const participants = await prisma.conversationParticipantEntity.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    await Promise.all(
      participants.map(async (p) => {
        const preview = await this.chatService.getConversationPreviewForUser(
          conversationId,
          p.userId,
        );
        if (preview) {
          this.server.to(this.userRoom(p.userId)).emit('conversation_updated', {
            conversation: preview as ChatConversationListItemDto,
          });
        }
      }),
    );
  }

  async broadcastNewMessage(
    conversationId: string,
    message: ChatMessageDto,
  ) {
    const payload = { conversationId, message };

    this.server
      .to(this.conversationRoom(conversationId))
      .emit('message_created', payload);

    const participants = await prisma.conversationParticipantEntity.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    await Promise.all(
      participants.map(async (p) => {
        this.server.to(this.userRoom(p.userId)).emit('message_created', payload);

        const preview = await this.chatService.getConversationPreviewForUser(
          conversationId,
          p.userId,
        );
        if (preview) {
          this.server.to(this.userRoom(p.userId)).emit('conversation_updated', {
            conversation: preview as ChatConversationListItemDto,
          });
        }
      }),
    );
  }
}
