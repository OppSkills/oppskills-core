import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { createElement } from 'react';
import { render } from '@react-email/components';
import { EmailService } from './email.service';
import { EMAIL_EVENTS } from './email.events';
import { EventNotificationEmail } from '@oppskills/emails';
import type { AdminWelcomeEmailProps } from '@oppskills/emails';
import type {
  UserCreatedEventPayload,
  UserOnboardedEventPayload,
  EventJoinedEventPayload,
  EventDirectMessageEventPayload,
  EventBulkEmailPayload,
} from './email.events';
import { Logger } from 'src/_utils/logger';
import { prisma } from '@oppskills/db';
import { EventPassService } from '../event/event-pass.service';
import * as QRCode from 'qrcode';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => EventPassService))
    private readonly eventPassService: EventPassService,
  ) {}

  @OnEvent(EMAIL_EVENTS.USER_CREATED)
  async handleUserCreated(payload: UserCreatedEventPayload): Promise<void> {
    this.logger.log(`Handling user.created event for user ${payload.userId}`);

    await this.emailService.send({
      type: 'welcome',
      to: payload.email,
      props: {
        firstName: payload.firstName,
        email: payload.email,
      },
    });
  }

  @OnEvent(EMAIL_EVENTS.USER_ONBOARDED)
  async handleUserOnboarded(payload: UserOnboardedEventPayload): Promise<void> {
    this.logger.log(`Handling user.onboarded event for user ${payload.userId}`);

    await this.emailService.send({
      type: 'onboarding-complete',
      to: payload.email,
      props: {
        firstName: payload.firstName,
        email: payload.email,
        userCategory: payload.userCategory,
        locationCity: payload.locationCity,
      },
    });
  }

  @OnEvent(EMAIL_EVENTS.EVENT_JOINED)
  async handleEventJoined(payload: EventJoinedEventPayload): Promise<void> {
    this.logger.log(
      `Handling event.joined event for user ${payload.userId} joining ${payload.eventName}`,
    );

    await this.emailService.send({
      type: 'event-pass-pending',
      to: payload.email,
      props: {
        firstName: payload.firstName,
        email: payload.email,
        eventName: payload.eventName,
        eventDate: payload.eventDate,
        eventTime: payload.eventTime,
        eventLocation: payload.eventLocation,
        eventType: payload.eventType,
        registrationId: payload.registrationId,
        eventSlug: payload.eventSlug,
      },
    });
  }

  @OnEvent(EMAIL_EVENTS.EVENT_DIRECT_MESSAGE)
  async handleEventDirectMessage(
    payload: EventDirectMessageEventPayload,
  ): Promise<void> {
    this.logger.log(
      `Handling event.direct.message event for user ${payload.userId} joining ${payload.eventName}`,
    );

    await this.emailService.send({
      type: 'participant-direct-message',
      to: payload.email,
      props: {
        firstName: payload.firstName,
        email: payload.email,
        eventName: payload.eventName,
        eventSlug: payload.eventSlug,
        body: payload.body,
      },
    });
  }

  @OnEvent('event.participant.registered')
  async handleParticipantRegistered(payload: {
    eventId: string;
    userId: string;
    participantId: string;
    passSendingMode: 'IMMEDIATE' | 'APPROVAL';
  }): Promise<void> {
    const { eventId, userId, participantId, passSendingMode } = payload;
    this.logger.log(
      `Handling event.participant.registered for participant ${participantId}`,
    );

    // Fetch participant, user, and event details
    const participant = await prisma.eventParticipantEntity.findUnique({
      where: { id: participantId },
      include: {
        user: {
          include: {
            onboardingProfile: {
              include: { college: true },
            },
          },
        },
        event: true,
      },
    });

    if (!participant) {
      this.logger.warn(`Participant ${participantId} not found`);
      return;
    }

    const user = participant.user;
    const event = participant.event;

    if (passSendingMode === 'IMMEDIATE') {
      // Send event pass immediately
      await this.sendEventPassEmail(participant, user, event);
    } else {
      // Send pending email
      const eventDate = event.startDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const eventTime =
        event.startDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' onwards';
      let eventLocation: string | undefined;
      if (event.locationType === 'PHYSICAL') {
        eventLocation = [event.locationAddress, event.locationCity]
          .filter(Boolean)
          .join(', ');
      } else if (
        event.locationType === 'VIRTUAL' &&
        event.locationVirtualLink
      ) {
        eventLocation = 'Online Event';
      }

      await this.emailService.send({
        type: 'event-pass-pending',
        to: user.email,
        props: {
          firstName: user.firstName || undefined,
          email: user.email,
          eventName: event.name,
          eventDate,
          eventTime,
          eventLocation,
          eventType: event.eventType || undefined,
          registrationId: participant.id,
          eventSlug: event.slug,
        },
      });
    }
  }

  @OnEvent('event.participant.approved')
  async handleParticipantApproved(payload: {
    participantId: string;
    eventId: string;
    userId: string;
  }): Promise<void> {
    const { participantId } = payload;
    this.logger.log(
      `Handling event.participant.approved for participant ${participantId}`,
    );

    // Fetch full participant details
    const participant = await prisma.eventParticipantEntity.findUnique({
      where: { id: participantId },
      include: {
        user: {
          include: {
            onboardingProfile: {
              include: { college: true },
            },
          },
        },
        event: true,
      },
    });

    if (!participant) {
      this.logger.warn(`Participant ${participantId} not found`);
      return;
    }

    // Send event pass email
    await this.sendEventPassEmail(
      participant,
      participant.user,
      participant.event,
    );
  }

  private async sendEventPassEmail(
    participant: {
      id: string;
      user: {
        email: string;
        firstName: string | null;
        lastName: string | null;
        imageUrl: string | null;
        onboardingProfile: {
          college: { name: string } | null;
        } | null;
      };
      event: {
        name: string;
        slug: string;
        startDate: Date;
      };
    },
    user: {
      email: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
      onboardingProfile: {
        college: { name: string } | null;
      } | null;
    },
    event: {
      name: string;
      slug: string;
      startDate: Date;
    },
  ): Promise<void> {
    const participantName =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      'Participant Name';
    const participantCollege =
      user.onboardingProfile?.college?.name || 'College Name';
    const eventDate = event.startDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const eventTime =
      event.startDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' onwards';

    // Generate event pass in database BEFORE sending email
    const eventPass = await this.eventPassService.generateEventPass(
      participant.id,
    );

    // Prepare attachments: OG pass image (rendered image) and QR code PNG
    const ogImageUrl = (() => {
      const baseUrl = this.emailService['fromEmail']?.includes('@oppskills.com')
        ? 'https://oppskills.com'
        : 'https://oppskills.com';
      const params = new URLSearchParams({
        name: participantName,
        college: participantCollege,
        email: user.email,
        eventName: event.name,
        eventDate,
        eventTime,
        ticketId: eventPass.ticketId,
      });
      if (eventPass.token) params.set('token', eventPass.token);
      if (user.imageUrl) params.set('image', user.imageUrl);
      return `${baseUrl}/api/og/event-pass?${params.toString()}`;
    })();

    const attachments: Array<{ filename: string; content: string }> = [];

    // Sanitise ticketId for use in filenames (remove №, spaces, special chars)
    const safeTicketId = eventPass.ticketId
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    try {
      const resp = await fetch(ogImageUrl);
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        attachments.push({
          filename: `event-pass-${safeTicketId}.png`,
          content: Buffer.from(buf).toString('base64'),
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to fetch OG image for pass: ${err}`);
    }

    try {
      if (eventPass.token) {
        // QR must encode the full validation URL — identical to what the
        // event-pass page renders with QRCodeSVG on the ticket card.
        const qrUrl = `https://www.oppskills.com/pass/validate/${eventPass.token}`;
        const qrBuf = await QRCode.toBuffer(qrUrl, {
          type: 'png',
          errorCorrectionLevel: 'H',
        });
        attachments.push({
          filename: `pass-qr-${safeTicketId}.png`,
          content: qrBuf.toString('base64'),
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to generate QR code for pass: ${err}`);
    }

    const result = await this.emailService.send({
      type: 'event-pass',
      to: user.email,
      props: {
        firstName: user.firstName || undefined,
        email: user.email,
        participantName,
        participantCollege,
        participantImage: user.imageUrl || undefined,
        eventName: event.name,
        eventDate,
        eventTime,
        ticketId: eventPass.ticketId,
        passId: eventPass.id,
        token: eventPass.token,
        eventSlug: event.slug,
      },
      attachments,
    });

    if (result.success) {
      // Update participant with email sent status
      await prisma.eventParticipantEntity.update({
        where: { id: participant.id },
        data: {
          passEmailSent: true,
          passEmailSentAt: new Date(),
        },
      });
    }
  }
  @OnEvent(EMAIL_EVENTS.EVENT_BULK_EMAIL)
  async handleBulkEmail(payload: EventBulkEmailPayload): Promise<void> {
    const { eventId, htmlBody, organizerEmail, organizerName, eventName } =
      payload;
    this.logger.log(`Starting bulk email for event ${eventId}`);

    // Fetch event slug and participants
    const event = await prisma.eventEntity.findUnique({
      where: { id: eventId },
      select: { slug: true },
    });

    if (!event) {
      this.logger.error(`Event ${eventId} not found for bulk email`);
      return;
    }

    const participants = await prisma.eventParticipantEntity.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
          },
        },
      },
    });

    const BATCH_SIZE = 100;
    let sentCount = 0;

    for (let i = 0; i < participants.length; i += BATCH_SIZE) {
      const batch = participants.slice(i, i + BATCH_SIZE);
      const emailBatch: Array<{ to: string; subject: string; html: string }> =
        [];

      for (const participant of batch) {
        if (!participant.user.email) continue;

        const emailHtml = await render(
          createElement(EventNotificationEmail, {
            firstName: participant.user.firstName || 'Participant',
            eventName,
            eventSlug: event.slug,
            htmlBody,
          }),
        );

        emailBatch.push({
          to: participant.user.email,
          subject: `Update from ${eventName}`,
          html: emailHtml,
        });
      }

      if (emailBatch.length > 0) {
        await this.emailService.sendBatch(emailBatch);
        sentCount += emailBatch.length;
      }

      // reliable sleep
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    // Send success email to organizer
    await this.emailService.send({
      type: 'bulk-email-success',
      to: organizerEmail,
      props: {
        firstName: organizerName,
        eventName,
        count: sentCount,
      },
    });

    this.logger.log(
      `Finished bulk email for event ${eventId}. Sent ${sentCount} emails.`,
    );
  }

  @OnEvent(EMAIL_EVENTS.ADMIN_CREATED)
  async handleAdminCreated(payload: AdminWelcomeEmailProps): Promise<void> {
    this.logger.log(`Handling admin.created event for admin ${payload.email}`);

    await this.emailService.send({
      type: 'admin-welcome',
      to: payload.email,
      props: {
        firstName: payload.firstName,
        email: payload.email,
        password: payload.password,
      },
    });
  }
}
