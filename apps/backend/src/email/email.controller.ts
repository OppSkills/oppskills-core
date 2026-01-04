import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EMAIL_EVENTS, EventDirectMessageEventPayload } from './email.events';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { EventService } from '../event/event.service';

export class SendDirectMessageDto {
  @IsString()
  @IsNotEmpty()
  userId: string; // Recipient User ID

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  eventName: string;

  @IsString()
  @IsNotEmpty()
  eventSlug: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly EventService: EventService,
  ) {}

  @Post('messages/direct')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  async sendDirectMessage(
    @Request() req: { user: { id: string } },
    @Body() dto: SendDirectMessageDto,
  ) {
    const senderId = req.user.id;
    const { eventId, userId: recipientId } = dto;

    const event = await this.EventService.getEventByIdForDashboard(
      eventId,
      senderId,
    );

    const isOwner = event.ownerId === senderId;
    if (!isOwner) {
      throw new ForbiddenException(
        'Only organizers or managers can send messages for this event.',
      );
    }

    const payload: EventDirectMessageEventPayload = { ...dto };

    this.eventEmitter.emit(EMAIL_EVENTS.EVENT_DIRECT_MESSAGE, payload);

    return { success: true, message: 'Email queued successfully' };
  }
}
