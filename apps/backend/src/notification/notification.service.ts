import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { CreateNotificationDto } from './dto/schedule-notification.dto';
import { NotificationQueue } from './queue/notification.queue';
import { NotificationWorker } from './queue/notification.worker';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationQueue: NotificationQueue,
    private readonly notificationWorker: NotificationWorker,
  ) { }

  /**
   * Asserts that a user has edit/management permission for the targeted event or hackathon.
   * Returns the count of recipients found for that event or hackathon.
   */
  async assertEventOrHackathonAccess(
    userId: string,
    eventSlugOrId?: string,
    hackathonSlugOrId?: string,
  ): Promise<{ id: string; type: 'event' | 'hackathon'; recipientCount: number }> {
    if (eventSlugOrId && hackathonSlugOrId) {
      throw new BadRequestException(
        'Both event and hackathon identifiers cannot be provided together.',
      );
    }
    if (!eventSlugOrId && !hackathonSlugOrId) {
      throw new BadRequestException(
        'Either an event or hackathon identifier must be provided.',
      );
    }

    if (eventSlugOrId) {
      const event = await prisma.eventEntity.findFirst({
        where: {
          OR: [{ id: eventSlugOrId }, { slug: eventSlugOrId }],
          isDeleted: false,
        },
        select: { id: true, ownerId: true },
      });
      if (!event) throw new NotFoundException('Event not found');

      if (event.ownerId !== userId) {
        const hasManagerRole = await prisma.eventUserRoleEntity.findFirst({
          where: { eventId: event.id, userId, role: 'MANAGER' },
        });
        if (!hasManagerRole) {
          throw new ForbiddenException(
            'You do not have permission to view or manage notifications for this event.',
          );
        }
      }

      const count = await prisma.eventParticipantEntity.count({
        where: { eventId: event.id },
      });
      return { id: event.id, type: 'event', recipientCount: count };
    }

    if (hackathonSlugOrId) {
      const hackathon = await prisma.hackathonEntity.findFirst({
        where: {
          OR: [{ id: hackathonSlugOrId }, { slug: hackathonSlugOrId }],
          isDeleted: false,
        },
        select: { id: true, ownerId: true },
      });
      if (!hackathon) throw new NotFoundException('Hackathon not found');

      if (hackathon.ownerId !== userId) {
        const hasManagerRole = await prisma.hackathonUserRoleEntity.findFirst({
          where: { hackathonId: hackathon.id, userId, role: 'MANAGER' },
        });
        if (!hasManagerRole) {
          throw new ForbiddenException(
            'You do not have permission to view or manage notifications for this hackathon.',
          );
        }
      }

      const count = await prisma.hackathonRegistrationSubmissionEntity.count({
        where: { hackathonId: hackathon.id },
      });
      return { id: hackathon.id, type: 'hackathon', recipientCount: count };
    }

    return { id: '', type: 'event', recipientCount: 0 };
  }

  /**
   * Schedules or creates a new notification campaign.
   */
  async scheduleNotification(dto: CreateNotificationDto, userId: string) {
    const { id, type, recipientCount } = await this.assertEventOrHackathonAccess(
      userId,
      dto.eventId || dto.eventSlug,
      dto.hackathonId || dto.hackathonSlug,
    );

    const actualEventId = type === 'event' ? id : undefined;
    const actualHackathonId = type === 'hackathon' ? id : undefined;

    const scheduleType = dto.scheduleType || 'IMMEDIATELY';
    const status = dto.status || 'QUEUED';

    // Desired starting time
    const proposedStartTime =
      scheduleType === 'CUSTOM' && dto.scheduledAt
        ? new Date(dto.scheduledAt)
        : new Date();

    // Query active jobs (QUEUED or PROCESSING) to do slot-finding
    const activeJobs = await prisma.notifications.findMany({
      where: {
        status: { in: ['QUEUED', 'PROCESSING'] },
      },
      select: {
        createdAt: true,
        scheduledAt: true,
        expectedFinishAt: true,
      },
    });

    // Each active job has a time window: from jobStart to jobEnd
    const windows = activeJobs
      .map((job) => {
        const start = job.scheduledAt ? new Date(job.scheduledAt) : new Date(job.createdAt);
        const end = job.expectedFinishAt
          ? new Date(job.expectedFinishAt)
          : new Date(start.getTime() + 5 * 60 * 1000);
        return { start, end };
      })
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Loop to find a non-overlapping slot
    let startTimeMs = proposedStartTime.getTime();
    const durationMs = 10 * 1000; // 10 seconds

    let overlapFound = true;
    while (overlapFound) {
      overlapFound = false;
      const proposedEndMs = startTimeMs + durationMs;

      for (const win of windows) {
        const winStartMs = win.start.getTime();
        const winEndMs = win.end.getTime();

        // If there's an overlap between [startTimeMs, proposedEndMs] and [winStartMs, winEndMs]
        if (startTimeMs < winEndMs && winStartMs < proposedEndMs) {
          startTimeMs = winEndMs; // Shift the start time forward
          overlapFound = true;
          break; // break the inner loop to re-check since startTimeMs changed
        }
      }
    }

    const scheduledAt = new Date(startTimeMs);
    const expectedFinishAt = new Date(startTimeMs + durationMs);

    const notification = await prisma.notifications.create({
      data: {
        userId,
        eventId: actualEventId || null,
        hackathonId: actualHackathonId || null,
        content: dto.content,
        scheduleType,
        scheduledAt,
        status,
        totalRecipients: recipientCount,
        expectedFinishAt,
      },
    });

    // Enqueue the job immediately
    const delay = Math.max(0, scheduledAt.getTime() - Date.now());

    await this.notificationQueue.add(notification.id, delay);

    // Initial log inside notification logs
    await prisma.notificationLogs.create({
      data: {
        notificationId: notification.id,
        level: 'INFO',
        message: `Notification created and enqueued with delay of ${delay}ms`,
        meta: { delay, expectedFinishAt, recipientCount },
      },
    });


    return notification;
  }

  /**
   * Lists all notifications scheduled for a specific event.
   */
  async listNotificationsForEvent(eventSlugOrId: string, userId: string) {
    const { id: eventId } = await this.assertEventOrHackathonAccess(
      userId,
      eventSlugOrId,
      undefined,
    );

    return prisma.notifications.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        eventId: true,
        hackathonId: true,
        content: true,
        scheduleType: true,
        scheduledAt: true,
        status: true,
        totalRecipients: true,
        processedCount: true,
        successCount: true,
        failedCount: true,
        expectedFinishAt: true,
        completedAt: true,
        createdAt: true,
        logs: {
          select: {
            id: true,
            level: true,
            message: true,
            meta: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Lists all notifications scheduled for a specific hackathon.
   */
  async listNotificationsForHackathon(hackathonSlugOrId: string, userId: string) {
    const { id: hackathonId } = await this.assertEventOrHackathonAccess(
      userId,
      undefined,
      hackathonSlugOrId,
    );

    return prisma.notifications.findMany({
      where: { hackathonId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        eventId: true,
        hackathonId: true,
        content: true,
        scheduleType: true,
        scheduledAt: true,
        status: true,
        totalRecipients: true,
        processedCount: true,
        successCount: true,
        failedCount: true,
        expectedFinishAt: true,
        completedAt: true,
        createdAt: true,
        logs: {
          select: {
            id: true,
            level: true,
            message: true,
            meta: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * Fetches a notification by ID.
   */
  async getNotificationById(id: string, userId: string) {
    const notification = await prisma.notifications.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        eventId: true,
        hackathonId: true,
        content: true,
        scheduleType: true,
        scheduledAt: true,
        status: true,
        totalRecipients: true,
        processedCount: true,
        successCount: true,
        failedCount: true,
        expectedFinishAt: true,
        completedAt: true,
        createdAt: true,
        logs: {
          select: {
            id: true,
            level: true,
            message: true,
            meta: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Direct owner can always see their notifications
    if (notification.userId !== userId) {
      await this.assertEventOrHackathonAccess(
        userId,
        notification.eventId || undefined,
        notification.hackathonId || undefined,
      );
    }

    return notification;
  }

  /**
   * Deletes (cancels) a notification by ID.
   */
  async deleteNotification(id: string, userId: string) {
    const notification = await prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      await this.assertEventOrHackathonAccess(
        userId,
        notification.eventId || undefined,
        notification.hackathonId || undefined,
      );
    }

    return prisma.notifications.delete({
      where: { id },
    });
  }
}
