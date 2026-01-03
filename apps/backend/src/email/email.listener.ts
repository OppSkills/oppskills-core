import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EmailService } from './email.service';
import { EMAIL_EVENTS } from './email.events';
import type {
  UserCreatedEventPayload,
  UserOnboardedEventPayload,
  EventJoinedEventPayload,
  EventDirectMessageEventPayload,
} from './email.events';
import { Logger } from 'src/_utils/logger';

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  constructor(private readonly emailService: EmailService) { }

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
      type: 'event-pass',
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
  async handleEventDirectMessage(payload: EventDirectMessageEventPayload): Promise<void> {
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
}

