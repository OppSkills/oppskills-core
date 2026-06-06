import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { CreateNotificationDto } from '@oppskills/types';
import { NotificationQueue } from './queue/notification.queue';
import { NotificationWorker } from './queue/notification.worker';
import { Logger } from 'src/_utils/logger';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly notificationQueue: NotificationQueue,
    private readonly notificationWorker: NotificationWorker,
  ) {}

  /**
   * Asserts that a user has edit/management permission for the targeted event or hackathon.
   * Returns the count of recipients found for that event or hackathon.
   */
  async assertEventOrHackathonAccess(
    userId: string,
    eventSlugOrId?: string,
    hackathonSlugOrId?: string,
    communityId?: string,
    mode: 'view' | 'edit' = 'view',
  ): Promise<{
    id: string;
    type: 'event' | 'hackathon' | 'community';
    recipientCount: number;
  }> {
    const provided = [eventSlugOrId, hackathonSlugOrId, communityId].filter(Boolean);
    if (provided.length > 1) {
      throw new BadRequestException(
        'Only one identifier (event, hackathon, or community) can be provided.',
      );
    }
    if (provided.length === 0) {
      throw new BadRequestException(
        'Either an event, hackathon, or community identifier must be provided.',
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

    if (communityId) {
      const community = await prisma.communityEntity.findFirst({
        where: {
          id: communityId,
        },
        select: { id: true, ownerId: true },
      });
      if (!community) throw new NotFoundException('Community not found');

      if (community.ownerId !== userId) {
        const hasMemberRole = await prisma.communityMemberEntity.findFirst({
          where: { communityId: community.id, userId },
          select: { accessControlRole: true },
        });
        if (!hasMemberRole) {
          throw new ForbiddenException(
            'You do not have permission to view or manage notifications for this community.',
          );
        }

        const allowedRoles = mode === 'edit'
          ? ['ADMIN', 'MODERATOR']
          : ['ADMIN', 'MODERATOR', 'READ_ONLY'];

        if (!allowedRoles.includes(hasMemberRole.accessControlRole)) {
          throw new ForbiddenException(
            'You do not have permission to view or manage notifications for this community.',
          );
        }
      }

      const count = await prisma.communityMemberEntity.count({
        where: { communityId: community.id },
      });
      return { id: community.id, type: 'community', recipientCount: count };
    }

    return { id: '', type: 'event', recipientCount: 0 };
  }

  /**
   * Schedules or creates a new notification campaign.
   */
  async scheduleNotification(dto: CreateNotificationDto, userId: string) {
    const { id, type, recipientCount } =
      await this.assertEventOrHackathonAccess(
        userId,
        dto.eventId || dto.eventSlug,
        dto.hackathonId || dto.hackathonSlug,
        dto.communityId,
        'edit',
      );

    const actualEventId = type === 'event' ? id : undefined;
    const actualHackathonId = type === 'hackathon' ? id : undefined;
    const actualCommunityId = type === 'community' ? id : undefined;

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
        const start = job.scheduledAt
          ? new Date(job.scheduledAt)
          : new Date(job.createdAt);
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
        communityId: actualCommunityId || null,
        content: dto.content,
        scheduleType,
        scheduledAt,
        status,
        totalRecipients: recipientCount,
        expectedFinishAt,
      },
    });

    if (actualCommunityId) {
      this.logger.info({
        action: 'COMMUNITY_NOTIFICATION_CREATED',
        communityId: actualCommunityId,
        userId,
        notificationId: notification.id,
        recipientCount,
        scheduleType,
        scheduledAt,
      });
    }

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
      undefined,
      'view',
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
  async listNotificationsForHackathon(
    hackathonSlugOrId: string,
    userId: string,
  ) {
    const { id: hackathonId } = await this.assertEventOrHackathonAccess(
      userId,
      undefined,
      hackathonSlugOrId,
      undefined,
      'view',
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
   * Lists all notifications scheduled for a specific community.
   */
  async listNotificationsForCommunity(communityId: string, userId: string) {
    const { id } = await this.assertEventOrHackathonAccess(
      userId,
      undefined,
      undefined,
      communityId,
      'view',
    );

    return prisma.notifications.findMany({
      where: { communityId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        eventId: true,
        hackathonId: true,
        communityId: true,
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
        communityId: true,
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

    await this.assertEventOrHackathonAccess(
      userId,
      notification.eventId || undefined,
      notification.hackathonId || undefined,
      notification.communityId || undefined,
      'view',
    );

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

    await this.assertEventOrHackathonAccess(
      userId,
      notification.eventId || undefined,
      notification.hackathonId || undefined,
      notification.communityId || undefined,
      'edit',
    );

    const deleted = await prisma.notifications.delete({
      where: { id },
    });

    if (notification.communityId) {
      this.logger.info({
        action: 'COMMUNITY_NOTIFICATION_DELETED',
        communityId: notification.communityId,
        userId,
        notificationId: notification.id,
      });
    }

    return deleted;
  }
}
