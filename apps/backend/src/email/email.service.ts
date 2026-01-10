import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { createElement } from 'react';
import { render } from '@react-email/components';
import {
  WelcomeEmail,
  WelcomeEmailProps,
  OnboardingCompleteEmail,
  OnboardingCompleteEmailProps,
  EventPassPendingEmail,
  EventPassPendingEmailProps,
  ParticipantDirectMessage,
  ParticipantDirectMessageProps,
} from '@oppskills/emails';
import { Logger } from 'src/_utils/logger';

export type EmailType = 'welcome' | 'onboarding-complete' | 'event-pass-pending' | 'participant-direct-message';

export interface SendEmailOptions<T extends EmailType> {
  type: T;
  to: string;
  props: T extends 'welcome'
  ? WelcomeEmailProps
  : T extends 'onboarding-complete'
  ? OnboardingCompleteEmailProps
  : T extends 'event-pass-pending'
  ? EventPassPendingEmailProps
  : T extends 'participant-direct-message'
  ? ParticipantDirectMessageProps
  : never;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'OppSkills <noreply@oppskills.com>',
    );
    this.enabled = !!apiKey;

    if (this.enabled) {
      this.resend = new Resend(apiKey);
      this.logger.log('Email service initialized with Resend');
    } else {
      this.logger.warn(
        'RESEND_API_KEY not configured - emails will be logged but not sent',
      );
    }
  }

  /**
   * Send an email using the specified template
   */
  async send<T extends EmailType>(
    options: SendEmailOptions<T>,
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    const { type, to, props } = options;

    try {
      const { subject, html } = await this.renderEmail(type, props);

      if (!this.enabled) {
        this.logger.log(`[DRY RUN] Would send "${type}" email to ${to}`);
        this.logger.debug(`Subject: ${subject}`);
        return { success: true, id: 'dry-run' };
      }

      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (result.error) {
        this.logger.error(
          `Failed to send "${type}" email to ${to}: ${result.error.message}`,
        );
        return { success: false, error: result.error.message };
      }

      this.logger.log(`Sent "${type}" email to ${to}, id: ${result.data?.id}`);
      return { success: true, id: result.data?.id };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending "${type}" email to ${to}: ${message}`);
      return { success: false, error: message };
    }
  }

  /**
   * Render email template to HTML with subject
   */
  private async renderEmail(
    type: EmailType,
    props: WelcomeEmailProps | OnboardingCompleteEmailProps | EventPassPendingEmailProps | ParticipantDirectMessageProps,
  ): Promise<{ subject: string; html: string }> {
    switch (type) {
      case 'welcome': {
        const p = props as WelcomeEmailProps;
        const element = createElement(WelcomeEmail, p);
        const html = await render(element);
        return {
          subject: 'Welcome to OppSkills - Start Your Journey!',
          html,
        };
      }
      case 'onboarding-complete': {
        const p = props as OnboardingCompleteEmailProps;
        const element = createElement(OnboardingCompleteEmail, p);
        const html = await render(element);
        return {
          subject: 'Profile Complete - Start Exploring OppSkills!',
          html,
        };
      }
      case 'event-pass-pending': {
        const p = props as EventPassPendingEmailProps;
        const element = createElement(EventPassPendingEmail, p);
        const html = await render(element);
        return {
          subject: `Your registration for ${p.eventName} is pending review`,
          html,
        };
      }
      case 'participant-direct-message': {
        const p = props as ParticipantDirectMessageProps;
        const element = createElement(ParticipantDirectMessage, p);
        const html = await render(element);
        return {
          subject: `You have a new message from the organizer of ${p.eventName}`,
          html,
        };
      }
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  }
}

