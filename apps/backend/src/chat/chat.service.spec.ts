import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';

jest.mock('@oppskills/db', () => ({
  ConversationType: {
    DIRECT: 'DIRECT',
    GROUP: 'GROUP',
  },
  MessageType: {
    TEXT: 'TEXT',
    SYSTEM: 'SYSTEM',
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    DOCUMENT: 'DOCUMENT',
  },
  AttachmentKind: {
    IMAGE: 'IMAGE',
    VIDEO: 'VIDEO',
    DOCUMENT: 'DOCUMENT',
  },
  prisma: {
    conversationParticipantEntity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    conversationEntity: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    conversationDirectKeyEntity: {
      findUnique: jest.fn(),
    },
    userEntity: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    messageEntity: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    messageDeliveryEntity: {
      count: jest.fn(),
      createMany: jest.fn(),
    },
    messageAttachmentEntity: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((fn: (tx: unknown) => unknown) =>
      fn({
        conversationEntity: {
          create: jest.fn(),
          update: jest.fn(),
        },
        messageEntity: {
          create: jest.fn(),
        },
      }),
    ),
  },
}));

const { prisma } = jest.requireMock('@oppskills/db');

describe('ChatService', () => {
  let service: ChatService;

  const mediaService = {
    resolveObjectKeyFromStoredUrl: jest.fn(),
    assertChatAttachmentKey: jest.fn(),
    getObjectStream: jest.fn(),
  };

  const presenceService = {
    enrichMembersForViewer: jest.fn(async (members: unknown[]) => members),
    getPresenceMap: jest.fn(async () => new Map()),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChatService(mediaService as never, presenceService as never);
  });

  describe('assertParticipant', () => {
    it('throws ForbiddenException when user is not a participant', async () => {
      prisma.conversationParticipantEntity.findUnique.mockResolvedValue(null);
      await expect(
        service.assertParticipant('user-1', 'conv-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getOrCreateDirect', () => {
    it('rejects chatting with yourself', async () => {
      await expect(
        service.getOrCreateDirect('user-1', 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listMessages', () => {
    it('rejects using both before and after cursors', async () => {
      prisma.conversationParticipantEntity.findUnique.mockResolvedValue({
        id: 'p1',
      });

      await expect(
        service.listMessages('user-1', 'conv-1', 10, 'before-id', 'after-id'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('returns cursor page for latest messages', async () => {
      prisma.conversationParticipantEntity.findUnique.mockResolvedValue({
        id: 'p1',
      });
      prisma.messageEntity.findMany.mockResolvedValue([
        {
          id: 'm2',
          conversationId: 'conv-1',
          senderId: 'user-2',
          type: 'TEXT',
          body: 'Hi',
          createdAt: new Date('2026-06-04T12:00:00Z'),
          sender: {
            id: 'user-2',
            email: 'b@test.com',
            firstName: 'Bob',
            lastName: null,
            imageUrl: null,
          },
          replyTo: null,
          attachment: null,
        },
        {
          id: 'm1',
          conversationId: 'conv-1',
          senderId: 'user-1',
          type: 'TEXT',
          body: 'Hey',
          createdAt: new Date('2026-06-04T11:00:00Z'),
          sender: {
            id: 'user-1',
            email: 'a@test.com',
            firstName: 'Ann',
            lastName: null,
            imageUrl: null,
          },
          replyTo: null,
          attachment: null,
        },
      ]);
      prisma.messageDeliveryEntity.createMany.mockResolvedValue({ count: 1 });
      prisma.messageDeliveryEntity.count.mockResolvedValue(0);
      prisma.conversationParticipantEntity.findMany.mockResolvedValue([
        { userId: 'user-2' },
      ]);

      const result = await service.listMessages('user-1', 'conv-1', 1);

      expect(result.hasMore).toBe(true);
      expect(result.nextCursor).toBe('m2');
      expect(result.data).toHaveLength(1);
    });
  });

  describe('computeDeliveryStatus via mapMessage', () => {
    it('returns DELIVERED when all other participants acknowledged', async () => {
      prisma.conversationParticipantEntity.findMany.mockResolvedValue([
        { userId: 'user-2' },
      ]);
      prisma.messageDeliveryEntity.count.mockResolvedValue(1);

      const status = await service['computeDeliveryStatus'](
        'm1',
        'user-1',
        'conv-1',
        'user-1',
      );

      expect(status).toBe('DELIVERED');
    });

    it('returns SENT when delivery is incomplete', async () => {
      prisma.conversationParticipantEntity.findMany.mockResolvedValue([
        { userId: 'user-2' },
      ]);
      prisma.messageDeliveryEntity.count.mockResolvedValue(0);

      const status = await service['computeDeliveryStatus'](
        'm1',
        'user-1',
        'conv-1',
        'user-1',
      );

      expect(status).toBe('SENT');
    });

    it('uses precomputed active participants without querying participants', async () => {
      prisma.messageDeliveryEntity.count.mockResolvedValue(1);

      const status = await service['computeDeliveryStatus'](
        'm1',
        'user-1',
        'conv-1',
        'user-1',
        ['user-1', 'user-2'],
      );

      expect(status).toBe('DELIVERED');
      expect(
        prisma.conversationParticipantEntity.findMany,
      ).not.toHaveBeenCalled();
    });
  });
});
