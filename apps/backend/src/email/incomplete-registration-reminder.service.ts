import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { prisma } from '@oppskills/db';
import { Logger } from 'src/_utils/logger';
import { EmailService } from './email.service';

export type IncompleteRegistrationReminderRunResult = {
  hackathonEmailsAttempted: number;
  hackathonEmailsSent: number;
  eventEmailsAttempted: number;
  eventEmailsSent: number;
  /** Free event: participant joined but no saved registration answers */
  freeEventEmailsAttempted: number;
  freeEventEmailsSent: number;
};

type HackathonReminderRow = {
  paymentId: string;
  slug: string;
  title: string;
  startDate: Date;
  endDate: Date;
  locationType: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationVirtualLink: string | null;
  payerEmail: string;
  firstName: string | null;
  lastName: string | null;
};

type EventReminderRow = {
  paymentId: string;
  slug: string;
  name: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  locationType: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationVirtualLink: string | null;
  payerEmail: string;
  firstName: string | null;
  lastName: string | null;
};

type FreeEventReminderRow = {
  participantId: string;
  slug: string;
  name: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  locationType: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationVirtualLink: string | null;
  payerEmail: string;
  firstName: string | null;
  lastName: string | null;
};

export function formatListingLocation(params: {
  locationType: string | null;
  locationAddress: string | null;
  locationCity: string | null;
  locationVirtualLink: string | null;
}): string {
  const t = params.locationType;
  if (t === 'VIRTUAL') {
    return 'Online';
  }
  if (params.locationCity || params.locationAddress) {
    return [params.locationAddress, params.locationCity]
      .filter(Boolean)
      .join(', ');
  }
  if (params.locationVirtualLink) {
    return 'Online';
  }
  return 'Check event details';
}

/** Minimum minutes between reminder emails for the same payment row. */
export const INCOMPLETE_REGISTRATION_REMINDER_MIN_MINUTES = 30;

@Injectable()
export class IncompleteRegistrationReminderService {
  private readonly logger = new Logger(IncompleteRegistrationReminderService.name);

  /** ISO timestamp of the last cron `run()` completion (success or failure). */
  lastRunFinishedAt: string | null = null;

  /** Result of the last successful `run()`, if any. */
  lastRunResult: IncompleteRegistrationReminderRunResult | null = null;

  /** Error message if the last `run()` threw. */
  lastRunError: string | null = null;

  constructor(private readonly emailService: EmailService) {}

  /**
   * Sends incomplete-registration reminder emails for approved hackathons/events
   * where payment is captured/authorized but no registration submission exists.
   *
   * Hackathons: one row per `hackathon_payment` with successful status where the
   * payer has no `hackathon_registration_submission` for that hackathon (same
   * `(hackathon_id, user_id)` pair as `RegistrationSubmitService.getRegistrationStatus`
   * when `hasSubmitted` is false). This matches users who paid but `submitRegistration`
   * failed or never ran after checkout.
   *
   * Only targets listings that are still open for registration (aligned with
   * submit/join validation): lifecycle status, not paused, before end date, and
   * before registration deadline when one is set.
   */
  async run(): Promise<IncompleteRegistrationReminderRunResult> {
    this.lastRunError = null;
    try {
      return await this.runInternal();
    } catch (err) {
      this.lastRunError = err instanceof Error ? err.message : String(err);
      this.lastRunFinishedAt = new Date().toISOString();
      throw err;
    }
  }

  private async runInternal(): Promise<IncompleteRegistrationReminderRunResult> {
    const cutoff = new Date(
      Date.now() -
        INCOMPLETE_REGISTRATION_REMINDER_MIN_MINUTES * 60 * 1000,
    );

    const now = new Date();

    const baseUrl = process.env.FRONTEND_URL || 'https://oppskills.com';

    const hackathonRows = await prisma.$queryRaw<HackathonReminderRow[]>(
      Prisma.sql`
        SELECT
          hp.id AS "paymentId",
          h.slug AS "slug",
          h.title AS "title",
          h."startDate" AS "startDate",
          h."endDate" AS "endDate",
          h.location_type::text AS "locationType",
          h.location_address AS "locationAddress",
          h.location_city AS "locationCity",
          h.location_virtual_link AS "locationVirtualLink",
          u.email AS "payerEmail",
          u."firstName" AS "firstName",
          u."lastName" AS "lastName"
        FROM oppskills.hackathon_payment hp
        INNER JOIN oppskills.hackathon h ON h.id = hp.hackathon_id
        INNER JOIN oppskills."user" u ON u.id = hp.payer_user_id
        WHERE hp.payment_status IN ('CAPTURED', 'AUTHORIZED')
          AND h.is_deleted = false
          AND h.approval_status = 'APPROVED'
          AND h.status IN ('PUBLISHED', 'ONGOING')
          AND h.is_registration_paused = false
          AND h."endDate" >= ${now}
          AND (h.registration_deadline IS NULL OR h.registration_deadline >= ${now})
          AND NOT EXISTS (
            SELECT 1
            FROM oppskills.hackathon_registration_submission hrs
            WHERE hrs.hackathon_id = hp.hackathon_id
              AND hrs.user_id = hp.payer_user_id
          )
          AND NOT EXISTS (
            SELECT 1
            FROM oppskills.incomplete_registration_reminder_log l
            WHERE l.hackathon_payment_id = hp.id
              AND l.last_sent_at > ${cutoff}
          )
      `,
    );

    const eventRows = await prisma.$queryRaw<EventReminderRow[]>(
      Prisma.sql`
        SELECT
          ep.id AS "paymentId",
          e.slug AS "slug",
          e.name AS "name",
          e.event_type::text AS "eventType",
          e.start_date AS "startDate",
          e.end_date AS "endDate",
          e.location_type::text AS "locationType",
          e.location_address AS "locationAddress",
          e.location_city AS "locationCity",
          e.location_virtual_link AS "locationVirtualLink",
          u.email AS "payerEmail",
          u."firstName" AS "firstName",
          u."lastName" AS "lastName"
        FROM oppskills.event_payment ep
        INNER JOIN oppskills.event e ON e.id = ep.event_id
        INNER JOIN oppskills."user" u ON u.id = ep.payer_user_id
        WHERE ep.payment_status IN ('CAPTURED', 'AUTHORIZED')
          AND e.is_deleted = false
          AND e.approval_status = 'APPROVED'
          AND e.status IN ('PUBLISHED', 'ONGOING')
          AND e.is_registration_paused = false
          AND e.end_date >= ${now}
          AND (e.registration_deadline IS NULL OR e.registration_deadline >= ${now})
          AND NOT EXISTS (
            SELECT 1
            FROM oppskills.event_registration_submission ers
            INNER JOIN oppskills.event_registration_answer era ON era.submission_id = ers.id
            WHERE ers.event_id = ep.event_id
              AND ers.user_id = ep.payer_user_id
          )
          AND NOT EXISTS (
            SELECT 1
            FROM oppskills.incomplete_registration_reminder_log l
            WHERE l.event_payment_id = ep.id
              AND l.last_sent_at > ${cutoff}
          )
      `,
    );

    const freeEventRows = await prisma.$queryRaw<FreeEventReminderRow[]>(
      Prisma.sql`
        SELECT
          ep.id AS "participantId",
          e.slug AS "slug",
          e.name AS "name",
          e.event_type::text AS "eventType",
          e.start_date AS "startDate",
          e.end_date AS "endDate",
          e.location_type::text AS "locationType",
          e.location_address AS "locationAddress",
          e.location_city AS "locationCity",
          e.location_virtual_link AS "locationVirtualLink",
          u.email AS "payerEmail",
          u."firstName" AS "firstName",
          u."lastName" AS "lastName"
        FROM oppskills.event_participant ep
        INNER JOIN oppskills.event e ON e.id = ep.event_id
        INNER JOIN oppskills."user" u ON u.id = ep.user_id
        WHERE e.is_free = true
          AND e.is_deleted = false
          AND e.approval_status = 'APPROVED'
          AND e.status IN ('PUBLISHED', 'ONGOING')
          AND e.is_registration_paused = false
          AND e.end_date >= ${now}
          AND (e.registration_deadline IS NULL OR e.registration_deadline >= ${now})
          AND NOT EXISTS (
            SELECT 1
            FROM oppskills.event_registration_submission ers
            INNER JOIN oppskills.event_registration_answer era ON era.submission_id = ers.id
            WHERE ers.event_id = e.id
              AND ers.user_id = ep.user_id
          )
          AND NOT EXISTS (
            SELECT 1
            FROM oppskills.incomplete_registration_reminder_log l
            WHERE l.event_participant_id = ep.id
              AND l.last_sent_at > ${cutoff}
          )
      `,
    );

    let hackathonEmailsSent = 0;
    let eventEmailsSent = 0;
    let freeEventEmailsSent = 0;

    for (const row of hackathonRows) {
      const eventDate = row.startDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const eventTime = row.startDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const eventLocation = formatListingLocation({
        locationType: row.locationType,
        locationAddress: row.locationAddress,
        locationCity: row.locationCity,
        locationVirtualLink: row.locationVirtualLink,
      });

      const result = await this.emailService.send({
        type: 'incomplete-registration',
        to: row.payerEmail,
        props: {
          firstName: row.firstName ?? undefined,
          email: row.payerEmail,
          eventName: row.title,
          eventDate,
          eventTime,
          eventLocation,
          eventSlug: row.slug,
          resourceType: 'hackathon',
          baseUrl,
        },
      });

      if (result.success) {
        await prisma.incompleteRegistrationReminderLogEntity.upsert({
          where: { hackathonPaymentId: row.paymentId },
          create: {
            hackathonPaymentId: row.paymentId,
            lastSentAt: new Date(),
            sentCount: 1,
          },
          update: {
            lastSentAt: new Date(),
            sentCount: { increment: 1 },
          },
        });
        hackathonEmailsSent += 1;
      } else {
        this.logger.warn(
          `Hackathon reminder email failed for payment ${row.paymentId}: ${result.error}`,
        );
      }
    }

    for (const row of eventRows) {
      const eventDate = row.startDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const eventTime = row.startDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const eventLocation = formatListingLocation({
        locationType: row.locationType,
        locationAddress: row.locationAddress,
        locationCity: row.locationCity,
        locationVirtualLink: row.locationVirtualLink,
      });

      const result = await this.emailService.send({
        type: 'incomplete-registration',
        to: row.payerEmail,
        props: {
          firstName: row.firstName ?? undefined,
          email: row.payerEmail,
          eventName: row.name,
          eventDate,
          eventTime,
          eventLocation,
          eventType: row.eventType,
          eventSlug: row.slug,
          resourceType: 'event',
          baseUrl,
        },
      });

      if (result.success) {
        await prisma.incompleteRegistrationReminderLogEntity.upsert({
          where: { eventPaymentId: row.paymentId },
          create: {
            eventPaymentId: row.paymentId,
            lastSentAt: new Date(),
            sentCount: 1,
          },
          update: {
            lastSentAt: new Date(),
            sentCount: { increment: 1 },
          },
        });
        eventEmailsSent += 1;
      } else {
        this.logger.warn(
          `Event reminder email failed for payment ${row.paymentId}: ${result.error}`,
        );
      }
    }

    for (const row of freeEventRows) {
      const eventDate = row.startDate.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const eventTime = row.startDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const eventLocation = formatListingLocation({
        locationType: row.locationType,
        locationAddress: row.locationAddress,
        locationCity: row.locationCity,
        locationVirtualLink: row.locationVirtualLink,
      });

      const result = await this.emailService.send({
        type: 'incomplete-registration',
        to: row.payerEmail,
        props: {
          firstName: row.firstName ?? undefined,
          email: row.payerEmail,
          eventName: row.name,
          eventDate,
          eventTime,
          eventLocation,
          eventType: row.eventType,
          eventSlug: row.slug,
          resourceType: 'event',
          baseUrl,
        },
      });

      if (result.success) {
        await prisma.incompleteRegistrationReminderLogEntity.upsert({
          where: { eventParticipantId: row.participantId },
          create: {
            eventParticipantId: row.participantId,
            lastSentAt: new Date(),
            sentCount: 1,
          },
          update: {
            lastSentAt: new Date(),
            sentCount: { increment: 1 },
          },
        });
        freeEventEmailsSent += 1;
      } else {
        this.logger.warn(
          `Free event reminder email failed for participant ${row.participantId}: ${result.error}`,
        );
      }
    }

    this.logger.log(
      `Incomplete registration reminders: hackathons ${hackathonEmailsSent}/${hackathonRows.length} sent, paid events ${eventEmailsSent}/${eventRows.length} sent, free events ${freeEventEmailsSent}/${freeEventRows.length} sent`,
    );

    const result: IncompleteRegistrationReminderRunResult = {
      hackathonEmailsAttempted: hackathonRows.length,
      hackathonEmailsSent,
      eventEmailsAttempted: eventRows.length,
      eventEmailsSent,
      freeEventEmailsAttempted: freeEventRows.length,
      freeEventEmailsSent,
    };
    this.lastRunResult = result;
    this.lastRunFinishedAt = new Date().toISOString();
    return result;
  }
}
