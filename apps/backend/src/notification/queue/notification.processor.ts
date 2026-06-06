import { prisma } from '@oppskills/db';
import { getResend } from 'src/_utils/resend.utils';
import { createElement } from 'react';
import { render } from '@react-email/components';
import {
  EventNotificationEmail,
  HackathonNotificationEmail,
  CommunityNotificationEmail,
} from '@oppskills/emails';
import { Logger } from 'src/_utils/logger';

const logger = new Logger('NotificationProcessor');

export async function processNotification(notificationId: string) {
  const notification = await prisma.notifications.findUnique({
    where: { id: notificationId },
  });

  if (!notification) return;

  if (notification.communityId) {
    logger.info({
      action: 'COMMUNITY_NOTIFICATION_PROCESSING_STARTED',
      communityId: notification.communityId,
      notificationId,
      totalRecipients: notification.totalRecipients,
    });
  }

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
    if (hackathon)
      entityDetails = { name: hackathon.name, slug: hackathon.slug };
  } else if (notification.communityId) {
    const community = await prisma.communityEntity.findUnique({
      where: { id: notification.communityId },
      select: { name: true, handle: true },
    });
    if (community)
      entityDetails = { name: community.name, slug: community.handle };
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

        batchRecipients = [];
        for (const p of participants) {
          if (p.user?.email) {
            batchRecipients.push({
              email: p.user.email,
              firstName: p.user.firstName,
            });
          }
        }
        lastIdThisBatch = participants[participants.length - 1].id;
      } else if (notification.hackathonId) {
        const submissions =
          await prisma.hackathonRegistrationSubmissionEntity.findMany({
            where: {
              hackathonId: notification.hackathonId,
              ...(lastProcessedId ? { id: { gt: lastProcessedId } } : {}),
            },
            take: 100,
            orderBy: { id: 'asc' },
            include: { user: { select: { email: true, firstName: true } } },
          });

        if (submissions.length === 0) break;

        batchRecipients = [];
        for (const s of submissions) {
          if (s.user?.email) {
            batchRecipients.push({
              email: s.user.email,
              firstName: s.user.firstName,
            });
          }
        }
        lastIdThisBatch = submissions[submissions.length - 1].id;
      } else if (notification.communityId) {
        const members = await prisma.communityMemberEntity.findMany({
          where: {
            communityId: notification.communityId,
            ...(lastProcessedId ? { id: { gt: lastProcessedId } } : {}),
          },
          take: 100,
          orderBy: { id: 'asc' },
          include: { user: { select: { email: true, firstName: true } } },
        });

        if (members.length === 0) break;

        batchRecipients = [];
        for (const m of members) {
          if (m.user?.email) {
            batchRecipients.push({
              email: m.user.email,
              firstName: m.user.firstName,
            });
          }
        }
        lastIdThisBatch = members[members.length - 1].id;
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
              } else if (notification.communityId) {
                subject = `Update for ${entityDetails.name}`;
                html = await render(
                  createElement(CommunityNotificationEmail, {
                    firstName: recipient.firstName || undefined,
                    communityName: entityDetails.name,
                    communityHandle: entityDetails.slug,
                    htmlBody: notification.content,
                  }),
                );
              }
            }

            return {
              from:
                process.env.RESEND_FROM_EMAIL ||
                'OppSkills <noreply@oppskills.com>',
              to: recipient.email,
              subject,
              html,
            };
          }),
        );

        const result = await resend.batch.send(batchPayload);

        if (result.error) {
          failedCount += batchRecipients.length;
          if (notification.communityId) {
            logger.error({
              action: 'COMMUNITY_NOTIFICATION_BATCH_FAILED',
              communityId: notification.communityId,
              notificationId,
              error: result.error.message,
            });
          }
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
        if (notification.communityId) {
          logger.error({
            action: 'COMMUNITY_NOTIFICATION_BATCH_FAILED',
            communityId: notification.communityId,
            notificationId,
            error: error.message || String(error),
          });
        }
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
    const finalStatus =
      successCount === 0 && failedCount > 0 ? 'FAILED' : 'COMPLETED';

    await prisma.notifications.update({
      where: { id: notificationId },
      data: {
        status: finalStatus,
        completedAt: new Date(),
      },
    });

    if (notification.communityId) {
      logger.info({
        action: 'COMMUNITY_NOTIFICATION_PROCESSING_COMPLETED',
        communityId: notification.communityId,
        notificationId,
        status: finalStatus,
        successCount,
        failedCount,
      });
    }

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
    if (notification && notification.communityId) {
      logger.error({
        action: 'COMMUNITY_NOTIFICATION_PROCESSING_FAILED',
        communityId: notification.communityId,
        notificationId,
        error: error.message || String(error),
      });
    }

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
