import { prisma } from '@oppskills/db';
import { getResend } from 'src/_utils/resend.utils';
import { createElement } from 'react';
import { render } from '@react-email/components';
import { EventNotificationEmail, HackathonNotificationEmail } from '@oppskills/emails';

export async function processNotification(notificationId: string) {
  const notification = await prisma.notifications.findUnique({
    where: { id: notificationId },
  });

  if (!notification) return;

  // Fetch event/hackathon details for template
  let entityDetails: { name: string; slug: string } | null = null;
  if (notification.eventId) {
    const event = await prisma.eventEntity.findUnique({
      where: { id: notification.eventId },
      select: { name: true, slug: true },
    });
    if (event) entityDetails = { name: event.name, slug: event.slug };
  } else if (notification.hackathonId) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: notification.hackathonId },
      select: { name: true, slug: true },
    });
    if (hackathon) entityDetails = { name: hackathon.name, slug: hackathon.slug };
  }

  // Mark status as PROCESSING immediately
  await prisma.notifications.update({
    where: { id: notificationId },
    data: {
      status: 'PROCESSING',
      processingBy: 'worker',
      processingStartedAt: new Date(),
      processingHeartbeatAt: new Date(),
    },
  });

  let lastProcessedId = notification.lastProcessedId || undefined;
  let successCount = notification.successCount || 0;
  let failedCount = notification.failedCount || 0;
  let processedCount = notification.processedCount || 0;

  try {
    const resend = getResend();
    while (true) {
      let batchRecipients: { email: string; firstName: string | null }[] = [];
      let lastIdThisBatch: string | null = null;

      if (notification.eventId) {
        const participants = await prisma.eventParticipantEntity.findMany({
          where: {
            eventId: notification.eventId,
            ...(lastProcessedId ? { id: { gt: lastProcessedId } } : {}),
          },
          take: 100,
          orderBy: { id: 'asc' },
          include: { user: { select: { email: true, firstName: true } } },
        });

        if (participants.length === 0) break;

        batchRecipients = participants
          .map((p) => ({ email: p.user?.email, firstName: p.user?.firstName }))
          .filter((u) => !!u.email) as { email: string; firstName: string | null }[];
        lastIdThisBatch = participants[participants.length - 1].id;
      } else if (notification.hackathonId) {
        const submissions = await prisma.hackathonRegistrationSubmissionEntity.findMany({
          where: {
            hackathonId: notification.hackathonId,
            ...(lastProcessedId ? { id: { gt: lastProcessedId } } : {}),
          },
          take: 100,
          orderBy: { id: 'asc' },
          include: { user: { select: { email: true, firstName: true } } },
        });

        if (submissions.length === 0) break;

        batchRecipients = submissions
          .map((s) => ({ email: s.user?.email, firstName: s.user?.firstName }))
          .filter((u) => !!u.email) as { email: string; firstName: string | null }[];
        lastIdThisBatch = submissions[submissions.length - 1].id;
      }

      if (batchRecipients.length === 0) break;

      try {
        const batchPayload = await Promise.all(
          batchRecipients.map(async (recipient) => {
            let html = notification.content;
            let subject = 'New Notification Update';

            if (entityDetails) {
              if (notification.eventId) {
                subject = `Update for ${entityDetails.name}`;
                html = await render(
                  createElement(EventNotificationEmail, {
                    firstName: recipient.firstName || undefined,
                    eventName: entityDetails.name,
                    eventSlug: entityDetails.slug,
                    htmlBody: notification.content,
                  }),
                );
              } else if (notification.hackathonId) {
                subject = `Update for ${entityDetails.name}`;
                html = await render(
                  createElement(HackathonNotificationEmail, {
                    firstName: recipient.firstName || undefined,
                    hackathonName: entityDetails.name,
                    hackathonSlug: entityDetails.slug,
                    htmlBody: notification.content,
                  }),
                );
              }
            }

            return {
              from: process.env.RESEND_FROM_EMAIL || 'OppSkills <noreply@oppskills.com>',
              to: recipient.email,
              subject,
              html,
            };
          }),
        );

        const result = await resend.batch.send(batchPayload);

        if (result.error) {
          failedCount += batchRecipients.length;
          await prisma.notificationLogs.create({
            data: {
              notificationId,
              level: 'ERROR',
              message: `Failed sending batch: ${result.error.message}`,
              meta: { recipients: batchRecipients, error: result.error },
            },
          });
        } else {
          successCount += batchRecipients.length;
        }
      } catch (error: any) {
        failedCount += batchRecipients.length;
        await prisma.notificationLogs.create({
          data: {
            notificationId,
            level: 'ERROR',
            message: `Error sending batch: ${error.message || error}`,
            meta: { recipients: batchRecipients },
          },
        });
      }

      // Update cursor and tracking fields
      processedCount += batchRecipients.length;
      lastProcessedId = lastIdThisBatch || lastProcessedId;

      await prisma.notifications.update({
        where: { id: notificationId },
        data: {
          processedCount,
          successCount,
          failedCount,
          lastProcessedId,
          processingHeartbeatAt: new Date(),
        },
      });
    }

    // Complete notification campaign
    await prisma.notifications.update({
      where: { id: notificationId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    await prisma.notificationLogs.create({
      data: {
        notificationId,
        level: 'INFO',
        message: `Notification processed fully. Success: ${successCount}, Failed: ${failedCount}`,
        meta: { successCount, failedCount, processedCount },
      },
    });

    console.log('Processing complete for notification:', notificationId);
  } catch (error: any) {
    await prisma.notifications.update({
      where: { id: notificationId },
      data: {
        status: 'FAILED',
        retryCount: { increment: 1 },
      },
    });

    await prisma.notificationLogs.create({
      data: {
        notificationId,
        level: 'ERROR',
        message: `Overall processing failed: ${error.message || error}`,
        meta: { error },
      },
    });

    throw error;
  }
}