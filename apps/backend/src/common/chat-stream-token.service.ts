import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

export type ChatStreamTokenPayload = {
  sub: string;
  conversationId: string;
  messageId: string;
};

@Injectable()
export class ChatStreamTokenService {
  constructor(private readonly configService: ConfigService) {}

  private secret(): string {
    return (
      this.configService.get<string>('CHAT_STREAM_TOKEN_SECRET') ??
      this.configService.get<string>('JWT_SECRET') ??
      'dev-chat-stream-secret'
    );
  }

  sign(userId: string, conversationId: string, messageId: string): string {
    return jwt.sign(
      { conversationId, messageId },
      this.secret(),
      {
        subject: userId,
        expiresIn: '15m',
      },
    );
  }

  verify(
    token: string,
    conversationId: string,
    messageId: string,
  ): ChatStreamTokenPayload {
    try {
      const decoded = jwt.verify(token, this.secret()) as jwt.JwtPayload;
      if (
        decoded.conversationId !== conversationId ||
        decoded.messageId !== messageId ||
        typeof decoded.sub !== 'string'
      ) {
        throw new UnauthorizedException('Invalid stream token scope');
      }
      return {
        sub: decoded.sub,
        conversationId,
        messageId,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired stream token');
    }
  }
}
