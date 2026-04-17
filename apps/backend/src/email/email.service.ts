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
  EventPassEmail,
  EventPassEmailProps,
  ParticipantDirectMessage,
  ParticipantDirectMessageProps,
  BulkEmailSuccessEmail,
  BulkEmailSuccessEmailProps,
  IncompleteRegistrationEmail,
  IncompleteRegistrationEmailProps,
  AdminWelcomeEmailProps,
  AdminOnboarding,
  HackathonJoinConfirmationEmail,
  HackathonJoinConfirmationEmailProps,
  HackathonNewMemberJoinedEmail,
  HackathonNewMemberJoinedEmailProps,
  HackathonTeamNotificationEmail,
  HackathonTeamNotificationEmailProps,
  ReferralInvitationEmail,
  ReferralInvitationEmailProps,
} from '@oppskills/emails';
import { Logger } from 'src/_utils/logger';

export type EmailType =
  | 'welcome'
  | 'onboarding-complete'
  | 'event-pass-pending'
  | 'event-pass'
  | 'participant-direct-message'
  | 'bulk-email-success'
  | 'incomplete-registration'
  | 'admin-welcome'
  | 'hackathon-join-confirmation'
  | 'hackathon-new-member-joined'
  | 'hackathon-team-notification'
  | 'referral-invitation';

export interface SendEmailOptions<T extends EmailType> {
  type: T;
  to: string;
  /** Local file attachments – content must be a Base64-encoded string. */
  attachments?: Array<{ filename: string; content: string }>;
  props: T extends 'welcome'
    ? WelcomeEmailProps
    : T extends 'onboarding-complete'
      ? OnboardingCompleteEmailProps
      : T extends 'event-pass-pending'
        ? EventPassPendingEmailProps
        : T extends 'event-pass'
          ? EventPassEmailProps
          : T extends 'participant-direct-message'
            ? ParticipantDirectMessageProps
            : T extends 'bulk-email-success'
              ? BulkEmailSuccessEmailProps
              : T extends 'incomplete-registration'
                ? IncompleteRegistrationEmailProps
                : T extends 'admin-welcome'
                  ? AdminWelcomeEmailProps
                  : T extends 'hackathon-join-confirmation'
                    ? HackathonJoinConfirmationEmailProps
                    : T extends 'hackathon-new-member-joined'
                      ? HackathonNewMemberJoinedEmailProps
                      : T extends 'hackathon-team-notification'
                        ? HackathonTeamNotificationEmailProps
                        : T extends 'referral-invitation'
                          ? ReferralInvitationEmailProps
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
    const fromEmail = this.configService.get<string>(
      'RESEND_FROM_EMAIL',
      'OppSkills <noreply@oppskills.com>',
    );
    this.fromEmail = fromEmail;
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
    const { type, to, props, attachments } = options as any;

    try {
      const { subject, html } = await this.renderEmail(type, props);

      if (!this.enabled) {
        this.logger.log(`[DRY RUN] Would send "${type}" email to ${to}`);
        this.logger.debug(`Subject: ${subject}`);
        return { success: true, id: 'dry-run' };
      }

      const payload: any = {
        from: this.fromEmail,
        to,
        subject,
        html,
      };

      if (attachments && attachments.length > 0) {
        // Resend expects { filename, content } where content is a Base64 string
        payload.attachments = attachments.map((a: any) => ({
          filename: a.filename,
          content: a.content,
        }));
      }

      const result = await this.resend.emails.send(payload);

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

  async sendBatch(
    emails: Array<{ to: string; subject: string; html: string }>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.enabled) {
        this.logger.log(
          `[DRY RUN] Would send batch of ${emails.length} emails`,
        );
        return { success: true };
      }

      const batchPayload = emails.map((email) => ({
        from: this.fromEmail,
        to: email.to,
        subject: email.subject,
        html: email.html,
      }));

      const result = await this.resend.batch.send(batchPayload);

      if (result.error) {
        this.logger.error(
          `Failed to send batch emails: ${result.error.message}`,
        );
        return { success: false, error: result.error.message };
      }

      this.logger.log(`Sent batch of ${emails.length} emails`);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending batch emails: ${message}`);
      return { success: false, error: message };
    }
  }

  /**
   * Render email template to HTML with subject
   */
  async renderEmail(
    type: EmailType,
    props:
      | WelcomeEmailProps
      | OnboardingCompleteEmailProps
      | EventPassPendingEmailProps
      | EventPassEmailProps
      | ParticipantDirectMessageProps
      | BulkEmailSuccessEmailProps
      | IncompleteRegistrationEmailProps
      | AdminWelcomeEmailProps
      | HackathonJoinConfirmationEmailProps
      | HackathonNewMemberJoinedEmailProps
      | HackathonTeamNotificationEmailProps
      | ReferralInvitationEmailProps,
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
      // case 'onboarding-complete': {
      //   const p = props as OnboardingCompleteEmailProps;
      //   const element = createElement(OnboardingCompleteEmail, p);
      //   const html = await render(element);
      //   return {
      //     subject: 'Profile Complete - Start Exploring OppSkills!',
      //     html,
      //   };
      // }
      case 'event-pass-pending': {
        const p = props as EventPassPendingEmailProps;
        const element = createElement(EventPassPendingEmail, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `Your registration for ${p.eventName} is pending review`,
          html,
        };
      }
      case 'event-pass': {
        const p = props as EventPassEmailProps;
        const element = createElement(EventPassEmail, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `Your event pass for ${p.eventName} is ready!`,
          html,
        };
      }
      case 'participant-direct-message': {
        const p = props as ParticipantDirectMessageProps;
        const element = createElement(ParticipantDirectMessage, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `You have a new message from the organizer of ${p.eventName}`,
          html,
        };
      }
      case 'bulk-email-success': {
        const p = props as BulkEmailSuccessEmailProps;
        const element = createElement(BulkEmailSuccessEmail, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `Bulk email sent for ${p.eventName}`,
          html,
        };
      }
      case 'incomplete-registration': {
        const p = props as IncompleteRegistrationEmailProps;
        const element = createElement(IncompleteRegistrationEmail, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `Action Required: Complete your registration for ${p.eventName}`,
          html,
        };
      }
      case 'admin-welcome': {
        const p = props as AdminWelcomeEmailProps;
        const element = createElement(AdminOnboarding, p);
        const html = await render(element, { pretty: true });
        return {
          subject: 'Welcome to Oppskills Admin',
          html,
        };
      }
      case 'hackathon-join-confirmation': {
        const p = props as HackathonJoinConfirmationEmailProps;
        const element = createElement(HackathonJoinConfirmationEmail, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `You joined ${p.hackathonName}`,
          html,
        };
      }
      case 'hackathon-new-member-joined': {
        const p = props as HackathonNewMemberJoinedEmailProps;
        const element = createElement(HackathonNewMemberJoinedEmail, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `${p.newMemberName} joined your team`,
          html,
        };
      }
      case 'hackathon-team-notification': {
        const p = props as HackathonTeamNotificationEmailProps;
        const element = createElement(HackathonTeamNotificationEmail, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `Update for team ${p.teamName} - ${p.hackathonName}`,
          html,
        };
      }
      case 'referral-invitation': {
        const p = props as ReferralInvitationEmailProps;
        const element = createElement(ReferralInvitationEmail, p);
        const html = await render(element, { pretty: true });
        return {
          subject: `You were added as a referral for ${p.entityName}`,
          html,
        };
      }
      default:
        throw new Error(`Unknown email type: ${type}`);
    }
  }
}
