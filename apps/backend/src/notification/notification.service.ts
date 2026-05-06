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
    eventId?: string,
    hackathonId?: string,
  ): Promise<number> {
    if (eventId && hackathonId) {
      throw new BadRequestException(
        'Both eventId and hackathonId cannot be provided together.',
      );
    }
    if (!eventId && !hackathonId) {
      throw new BadRequestException(
        'Either eventId or hackathonId must be provided.',
      );
    }

    if (eventId) {
      const event = await prisma.eventEntity.findUnique({
        where: { id: eventId, isDeleted: false },
        select: { id: true, ownerId: true },
      });
      if (!event) throw new NotFoundException('Event not found');

      if (event.ownerId !== userId) {
        const hasManagerRole = await prisma.eventUserRoleEntity.findFirst({
          where: { eventId, userId, role: 'MANAGER' },
        });
        if (!hasManagerRole) {
          throw new ForbiddenException(
            'You do not have permission to view or manage notifications for this event.',
          );
        }
      }

      // Count direct event participants
      return prisma.eventParticipantEntity.count({
        where: { eventId },
      });
    }

    if (hackathonId) {
      const hackathon = await prisma.hackathonEntity.findUnique({
        where: { id: hackathonId, isDeleted: false },
        select: { id: true, ownerId: true },
      });
      if (!hackathon) throw new NotFoundException('Hackathon not found');

      if (hackathon.ownerId !== userId) {
        const hasManagerRole = await prisma.hackathonUserRoleEntity.findFirst({
          where: { hackathonId, userId, role: 'MANAGER' },
        });
        if (!hasManagerRole) {
          throw new ForbiddenException(
            'You do not have permission to view or manage notifications for this hackathon.',
          );
        }
      }

      // Count direct hackathon registration submissions
      return prisma.hackathonRegistrationSubmissionEntity.count({
        where: { hackathonId },
      });
    }

    return 0;
  }

  /**
   * Schedules or creates a new notification campaign.
   */
  async scheduleNotification(dto: CreateNotificationDto, userId: string) {
    const totalRecipients = await this.assertEventOrHackathonAccess(
      userId,
      dto.eventId,
      dto.hackathonId,
    );

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
        eventId: dto.eventId || null,
        hackathonId: dto.hackathonId || null,
        content: dto.content,
        scheduleType,
        scheduledAt,
        status,
        totalRecipients,
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
        meta: { delay, expectedFinishAt, totalRecipients },
      },
    });

    return notification;
  }

  /**
   * Lists all notifications scheduled for a specific event.
   */
  async listNotificationsForEvent(eventId: string, userId: string) {
    await this.assertEventOrHackathonAccess(userId, eventId, undefined);

    return prisma.notifications.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      include: { logs: true },
    });
  }

  /**
   * Lists all notifications scheduled for a specific hackathon.
   */
  async listNotificationsForHackathon(hackathonId: string, userId: string) {
    await this.assertEventOrHackathonAccess(userId, undefined, hackathonId);

    return prisma.notifications.findMany({
      where: { hackathonId },
      orderBy: { createdAt: 'desc' },
      include: { logs: true },
    });
  }

  /**
   * Fetches a notification by ID.
   */
  async getNotificationById(id: string, userId: string) {
    const notification = await prisma.notifications.findUnique({
      where: { id },
      include: { logs: true },
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
