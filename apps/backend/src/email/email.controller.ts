import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  ForbiddenException,
  Param,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';

import {
  EMAIL_EVENTS,
  EventDirectMessageEventPayload,
  EventBulkEmailPayload,
  HackathonBulkEmailPayload,
} from './email.events';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { EventService } from '../event/event.service';
import { HackathonService } from '../hackathon/hackathon.service';
import { EmailService } from './email.service';
import { prisma } from '@oppskills/db';
import { sanitizeHtmlContent } from '../_utils/html-sanitizer.utils';

export class SendBulkEmailDto {
  @IsString()
  @IsOptional()
  eventId?: string;

  @IsString()
  @IsOptional()
  hackathonId?: string;

  @IsString()
  @IsNotEmpty()
  htmlBody: string;
}

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
  htmlBody: string;
}

@ApiTags('Email')
@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly EventService: EventService,
    private readonly hackathonService: HackathonService,
    private readonly emailService: EmailService,
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

    const payload: EventDirectMessageEventPayload = {
      ...dto,
      htmlBody: sanitizeHtmlContent(dto.htmlBody),
    };

    this.eventEmitter.emit(EMAIL_EVENTS.EVENT_DIRECT_MESSAGE, payload);

    return { success: true, message: 'Email queued successfully' };
  }

  @Post('bulk')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  async sendBulkEmail(
    @Request() req: { user: { id: string } },
    @Body() dto: SendBulkEmailDto,
  ) {
    const senderId = req.user.id;
    const { eventId, hackathonId, htmlBody } = dto;

    if (!eventId && !hackathonId) {
      throw new BadRequestException('Either eventId or hackathonId must be provided.');
    }

    if (eventId) {
      // Verify ownership/permission for event
      const event = await this.EventService.getEventByIdForDashboard(
        eventId,
        senderId,
      );

      const payload: EventBulkEmailPayload = {
        eventId,
        htmlBody: sanitizeHtmlContent(htmlBody),
        organizerEmail: event.owner.email,
        organizerName: event.owner.firstName || 'Organizer',
        eventName: event.name,
      };

      this.eventEmitter.emit(EMAIL_EVENTS.EVENT_BULK_EMAIL, payload);
    } else if (hackathonId) {
      // Verify ownership/permission for hackathon
      const hackathon = await prisma.hackathonEntity.findUnique({
        where: { id: hackathonId, isDeleted: false },
        include: { owner: true },
      });

      if (!hackathon) {
        throw new NotFoundException('Hackathon not found');
      }

      if (hackathon.ownerId !== senderId) {
        throw new ForbiddenException('Only the owner can send bulk emails for this hackathon.');
      }

      const payload: HackathonBulkEmailPayload = {
        hackathonId,
        htmlBody: sanitizeHtmlContent(htmlBody),
        organizerEmail: hackathon.owner.email,
        organizerName: hackathon.owner.firstName || 'Organizer',
        hackathonName: hackathon.name,
      };

      this.eventEmitter.emit(EMAIL_EVENTS.HACKATHON_BULK_EMAIL, payload);
    }

    return {
      success: true,
      message:
        'Bulk email started successfully. You will be notified when it is finished.',
    };
  }

  @Post('incomplete-registration/:eventId')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Send emails to users with incomplete registrations',
  })
  @ApiParam({ name: 'eventId', description: 'Event ID' })
  async sendIncompleteRegistrationEmails(
    @Request() req: { user: { id: string } },
    @Param('eventId') eventId: string,
  ) {
    const senderId = req.user.id;

    // Verify ownership/permission
    const event = await this.EventService.getEventByIdForDashboard(
      eventId,
      senderId,
    );

    const isOwner = event.ownerId === senderId;
    if (!isOwner) {
      throw new ForbiddenException(
        'Only organizers can send incomplete registration emails.',
      );
    }

    // Find users with incomplete registrations:
    // - Have a participant record (payment completed)
    // - Have a captured payment
    // - Do NOT have a registration submission
    const incompleteUsers = await prisma.$queryRaw<
      Array<{
        participantId: string;
        userId: string;
        email: string;
        firstName: string | null;
        lastName: string | null;
      }>
    >`
      SELECT 
        p.id AS "participantId",
        p.user_id AS "userId",
        u.email,
        u."firstName",
        u."lastName"
      FROM oppskills.event_participant p
      INNER JOIN oppskills."user" u ON u.id = p.user_id
      INNER JOIN oppskills.event_payment pay
        ON pay.event_id = p.event_id
        AND pay.payer_user_id = p.user_id
        AND pay.payment_status = 'CAPTURED'
      WHERE p.event_id = ${eventId}
      AND NOT EXISTS (
        SELECT 1 FROM oppskills.event_registration_submission sub
        WHERE sub.event_id = p.event_id AND sub.user_id = p.user_id
      )
    `;

    if (incompleteUsers.length === 0) {
      return {
        success: true,
        message: 'No users with incomplete registrations found.',
        emailsSent: 0,
      };
    }

    this.logger.log(
      `Found ${incompleteUsers.length} users with incomplete registrations for event ${eventId}`,
    );

    // Format event date and time
    const eventDate = event.startDate.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const eventTime = event.startDate.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Determine event location
    let eventLocation = 'Check event details';
    const locType = event.locationType as string | null;
    if (locType === 'ONLINE' || locType === 'VIRTUAL') {
      eventLocation = 'Online';
    } else if (event.locationCity || event.locationAddress) {
      eventLocation = [event.locationAddress, event.locationCity]
        .filter(Boolean)
        .join(', ');
    }

    // Send emails
    let successCount = 0;
    let failCount = 0;

    for (const user of incompleteUsers) {
      try {
        const result = await this.emailService.send({
          type: 'incomplete-registration',
          to: user.email,
          props: {
            firstName: user.firstName || undefined,
            email: user.email,
            eventName: event.name,
            eventDate,
            eventTime,
            eventLocation,
            eventType: event.eventType,
            eventSlug: event.slug,
            resourceType: 'event',
            incompleteRegistrationKind: 'paid',
          },
        });

        if (result.success) {
          successCount++;
          this.logger.log(
            `Sent incomplete registration email to ${user.email}`,
          );
        } else {
          failCount++;
          this.logger.error(
            `Failed to send email to ${user.email}: ${result.error}`,
          );
        }
      } catch (error) {
        failCount++;
        this.logger.error(`Error sending email to ${user.email}:`, error);
      }
    }

    return {
      success: true,
      message: `Sent ${successCount} emails, ${failCount} failed.`,
      emailsSent: successCount,
      emailsFailed: failCount,
      totalIncompleteUsers: incompleteUsers.length,
    };
  }
}
