import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { EmailService } from '../email/email.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import {
  TaskResponseDto,
  TaskThreadMessageResponseDto,
} from './dto/task-response.dto';
import { TaskStatus } from '@prisma/client';
import { Logger } from '../_utils/logger';
import { CommunityService } from '../community/community.service';

@Injectable()
export class CommunityTaskService {
  private readonly logger = new Logger(CommunityTaskService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly communityService: CommunityService,
  ) {}

  /**
   * Helper to map user role in community to a numeric hierarchy level:
   * OWNER/ADMIN = 3, MODERATOR = 2, READ_ONLY = 1.
   */
  private async getUserHierarchyLevel(
    userId: string,
    communityId: string,
  ): Promise<number> {
    const member = await this.communityService.getMemberRecord(userId, communityId);
    const rank = this.communityService.getRoleRank(member.accessControlRole);
    if (rank === 0) {
      throw new ForbiddenException(
        'You do not have permission to manage tasks in this community.',
      );
    }
    return rank;
  }

  private formatUserName(user: {
    firstName: string | null;
    lastName: string | null;
    email: string;
  }): string {
    const parts = [user.firstName, user.lastName].filter(
      (part): part is string =>
        typeof part === 'string' && part.trim().length > 0,
    );
    return parts.length > 0 ? parts.join(' ') : user.email.split('@')[0];
  }

  async createTask(
    currentUserId: string,
    communityId: string,
    dto: CreateTaskDto,
  ): Promise<TaskResponseDto> {
    // 1. Get hierarchy level of assigner and assignee
    const assignerLevel = await this.getUserHierarchyLevel(
      currentUserId,
      communityId,
    );
    const assigneeLevel = await this.getUserHierarchyLevel(
      dto.toUserId,
      communityId,
    );

    // 2. Validate hierarchy rule: Assigners can only assign to equal/lower levels
    if (assignerLevel < assigneeLevel) {
      this.logger.warn({
        action: 'COMMUNITY_TASK_HIERARCHY_VIOLATION',
        communityId,
        userId: currentUserId,
        assigneeUserId: dto.toUserId,
        assignerLevel,
        assigneeLevel,
      });
      throw new ForbiddenException(
        'You do not have permission to assign tasks to users with a higher access role in the hierarchy.',
      );
    }

    const dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    if (dueDate && Number.isNaN(dueDate.getTime())) {
      throw new BadRequestException('Invalid due date format.');
    }

    // 3. Create task record
    const task = await prisma.communityTaskEntity.create({
      data: {
        communityId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        dueDate,
        toUserId: dto.toUserId,
        byUserId: currentUserId,
        priority: dto.priority,
        status: TaskStatus.PENDING,
        tags: dto.tags,
        optForMail: dto.optForMail,
      },
      include: {
        assignedTo: true,
        assignedBy: true,
        community: true,
      },
    });

    this.logger.info({
      action: 'COMMUNITY_TASK_CREATED',
      communityId,
      userId: currentUserId,
      taskId: task.id,
      assignedToUserId: task.toUserId,
      priority: task.priority,
      tags: task.tags,
      optForMail: task.optForMail,
    });

    // 4. Send email notification if optForMail is true
    if (dto.optForMail && task.assignedTo.email) {
      const assignerName = this.formatUserName(task.assignedBy);
      const assigneeName = this.formatUserName(task.assignedTo);
      const formattedDate = task.dueDate
        ? task.dueDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : undefined;

      await this.emailService.send({
        type: 'community-task-assigned',
        to: task.assignedTo.email,
        props: {
          assigneeName,
          assignerName,
          communityName: task.community.name,
          taskTitle: task.title,
          taskDescription: task.description || undefined,
          dueDate: formattedDate,
          baseUrl: process.env.FRONTEND_URL || 'https://www.oppskills.com',
        },
      });
    }

    return {
      id: task.id,
      communityId: task.communityId,
      title: task.title,
      description: task.description || undefined,
      dueDate: task.dueDate?.toISOString(),
      toUserId: task.toUserId,
      toUserName: this.formatUserName(task.assignedTo),
      toUserAvatar: task.assignedTo.imageUrl || undefined,
      byUserId: task.byUserId,
      byUserName: this.formatUserName(task.assignedBy),
      byUserAvatar: task.assignedBy.imageUrl || undefined,
      priority: task.priority,
      status: task.status,
      tags: task.tags,
      optForMail: task.optForMail,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  async listTasks(
    currentUserId: string,
    communityId: string,
  ): Promise<TaskResponseDto[]> {
    // Verify membership
    await this.getUserHierarchyLevel(currentUserId, communityId);

    const tasks = await prisma.communityTaskEntity.findMany({
      where: {
        communityId,
        OR: [{ toUserId: currentUserId }, { byUserId: currentUserId }],
      },
      include: {
        assignedTo: true,
        assignedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tasks.map((task) => ({
      id: task.id,
      communityId: task.communityId,
      title: task.title,
      description: task.description || undefined,
      dueDate: task.dueDate?.toISOString(),
      toUserId: task.toUserId,
      toUserName: this.formatUserName(task.assignedTo),
      toUserAvatar: task.assignedTo.imageUrl || undefined,
      byUserId: task.byUserId,
      byUserName: this.formatUserName(task.assignedBy),
      byUserAvatar: task.assignedBy.imageUrl || undefined,
      priority: task.priority,
      status: task.status,
      tags: task.tags,
      optForMail: task.optForMail,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }));
  }

  async getTask(
    currentUserId: string,
    taskId: string,
  ): Promise<TaskResponseDto> {
    const task = await prisma.communityTaskEntity.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
        assignedBy: true,
        communityTaskThreadMessageEntities: {
          include: {
            user: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    // Verify membership
    await this.getUserHierarchyLevel(currentUserId, task.communityId);

    // Verify user is assignee or assigner
    if (currentUserId !== task.toUserId && currentUserId !== task.byUserId) {
      throw new ForbiddenException(
        'You do not have permission to view this task.',
      );
    }

    const messages = task.communityTaskThreadMessageEntities.map((msg) => ({
      id: msg.id,
      taskId: msg.taskId,
      userId: msg.userId,
      userName: this.formatUserName(msg.user),
      userAvatar: msg.user.imageUrl || undefined,
      type: msg.type,
      content: msg.content,
      fileName: msg.fileName || undefined,
      fileSize: msg.fileSize || undefined,
      mimeType: msg.mimeType || undefined,
      createdAt: msg.createdAt.toISOString(),
    }));

    return {
      id: task.id,
      communityId: task.communityId,
      title: task.title,
      description: task.description || undefined,
      dueDate: task.dueDate?.toISOString(),
      toUserId: task.toUserId,
      toUserName: this.formatUserName(task.assignedTo),
      toUserAvatar: task.assignedTo.imageUrl || undefined,
      byUserId: task.byUserId,
      byUserName: this.formatUserName(task.assignedBy),
      byUserAvatar: task.assignedBy.imageUrl || undefined,
      priority: task.priority,
      status: task.status,
      tags: task.tags,
      optForMail: task.optForMail,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      messages,
    };
  }

  async createComment(
    currentUserId: string,
    taskId: string,
    dto: CreateCommentDto,
  ): Promise<TaskThreadMessageResponseDto> {
    const task = await prisma.communityTaskEntity.findUnique({
      where: { id: taskId },
      select: { toUserId: true, byUserId: true, status: true, communityId: true },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    // Verify membership and dashboard role
    await this.getUserHierarchyLevel(currentUserId, task.communityId);

    // Verify user is assignee or assigner
    if (currentUserId !== task.toUserId && currentUserId !== task.byUserId) {
      this.logger.warn({
        action: 'COMMUNITY_TASK_COMMENT_PERMISSION_DENIED',
        userId: currentUserId,
        taskId,
      });
      throw new ForbiddenException(
        'Only the assignee or assigner can comment on this task thread.',
      );
    }

    const message = await prisma.communityTaskThreadMessageEntity.create({
      data: {
        taskId,
        userId: currentUserId,
        type: dto.type,
        content: dto.content.trim(),
        fileName: dto.fileName || null,
        fileSize: dto.fileSize || null,
        mimeType: dto.mimeType || null,
      },
      include: {
        user: true,
      },
    });

    this.logger.info({
      action: 'COMMUNITY_TASK_COMMENT_CREATED',
      communityId: task.communityId,
      userId: currentUserId,
      taskId,
      commentId: message.id,
      commentType: dto.type,
      hasAttachment: !!dto.fileName,
    });

    return {
      id: message.id,
      taskId: message.taskId,
      userId: message.userId,
      userName: this.formatUserName(message.user),
      userAvatar: message.user.imageUrl || undefined,
      type: message.type,
      content: message.content,
      fileName: message.fileName || undefined,
      fileSize: message.fileSize || undefined,
      mimeType: message.mimeType || undefined,
      createdAt: message.createdAt.toISOString(),
    };
  }

  async updateTaskStatus(
    currentUserId: string,
    taskId: string,
    dto: UpdateTaskStatusDto,
  ): Promise<TaskResponseDto> {
    const task = await prisma.communityTaskEntity.findUnique({
      where: { id: taskId },
      include: {
        assignedTo: true,
        assignedBy: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found.');
    }

    // Verify membership and dashboard role
    await this.getUserHierarchyLevel(currentUserId, task.communityId);

    const isAssigner = currentUserId === task.byUserId;
    const isAssignee = currentUserId === task.toUserId;

    // Verify user belongs to assignee or assigner
    if (!isAssigner && !isAssignee) {
      this.logger.warn({
        action: 'COMMUNITY_TASK_UPDATE_PERMISSION_DENIED',
        taskId,
        userId: currentUserId,
      });
      throw new ForbiddenException(
        'You do not have permission to modify this task.',
      );
    }

    // "only assigner can approve or reject the task"
    // COMPLETED -> approve, CANCELLED -> reject/cancel
    if (
      dto.status === TaskStatus.COMPLETED ||
      dto.status === TaskStatus.CANCELLED
    ) {
      if (!isAssigner) {
        throw new ForbiddenException(
          'Only the assigner can approve, complete or reject/cancel this task.',
        );
      }
    }

    // Assigner can revert action to in progress, assignee can start pending task to in progress
    if (dto.status === TaskStatus.IN_PROGRESS) {
      if (
        task.status === TaskStatus.COMPLETED ||
        task.status === TaskStatus.CANCELLED
      ) {
        if (!isAssigner) {
          throw new ForbiddenException(
            'Only the assigner can revert this task to In Progress.',
          );
        }
      } else {
        if (!isAssignee) {
          throw new ForbiddenException(
            'Only the assignee can start work on this task.',
          );
        }
      }
    }

    const updatedTask = await prisma.communityTaskEntity.update({
      where: { id: taskId },
      data: { status: dto.status },
      include: {
        assignedTo: true,
        assignedBy: true,
        community: true,
      },
    });

    this.logger.info({
      action: 'COMMUNITY_TASK_STATUS_UPDATED',
      communityId: updatedTask.communityId,
      userId: currentUserId,
      taskId,
      oldStatus: task.status,
      newStatus: dto.status,
      optForMail: updatedTask.optForMail,
    });

    let alertContent = '';
    if (dto.status === TaskStatus.COMPLETED) {
      alertContent = 'Task Approved';
    } else if (dto.status === TaskStatus.CANCELLED) {
      alertContent = 'Task Rejected';
    } else if (
      dto.status === TaskStatus.IN_PROGRESS &&
      (task.status === TaskStatus.COMPLETED ||
        task.status === TaskStatus.CANCELLED)
    ) {
      alertContent = 'Task Reverted to In Progress';
    }

    if (alertContent) {
      await prisma.communityTaskThreadMessageEntity.create({
        data: {
          taskId,
          userId: currentUserId,
          type: 'ALERT',
          content: alertContent,
        },
      });
    }

    if (
      updatedTask.optForMail &&
      updatedTask.assignedTo.email &&
      task.status !== dto.status &&
      (dto.status === TaskStatus.COMPLETED ||
        dto.status === TaskStatus.CANCELLED)
    ) {
      const assignerName = this.formatUserName(updatedTask.assignedBy);
      const assigneeName = this.formatUserName(updatedTask.assignedTo);
      const formattedDate = updatedTask.dueDate
        ? updatedTask.dueDate.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : undefined;

      await this.emailService.send({
        type: 'community-task-status-updated',
        to: updatedTask.assignedTo.email,
        props: {
          assigneeName,
          assignerName,
          communityName: updatedTask.community.name,
          taskTitle: updatedTask.title,
          taskDescription: updatedTask.description || undefined,
          statusText:
            dto.status === TaskStatus.COMPLETED ? 'approved' : 'rejected',
          dueDate: formattedDate,
          baseUrl: process.env.FRONTEND_URL || 'https://www.oppskills.com',
        },
      });
    }

    return this.getTask(currentUserId, taskId);
  }

  async deleteComment(
    currentUserId: string,
    taskId: string,
    commentId: string,
  ): Promise<void> {
    const comment = await prisma.communityTaskThreadMessageEntity.findUnique({
      where: { id: commentId },
      select: {
        userId: true,
        taskId: true,
        task: {
          select: {
            toUserId: true,
            byUserId: true,
            communityId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found.');
    }

    if (comment.taskId !== taskId) {
      throw new BadRequestException(
        'Comment does not belong to the specified task.',
      );
    }

    if (
      currentUserId !== comment.task.toUserId &&
      currentUserId !== comment.task.byUserId
    ) {
      throw new ForbiddenException(
        'You do not have permission to access this task thread.',
      );
    }

    await this.getUserHierarchyLevel(currentUserId, comment.task.communityId);

    if (comment.userId !== currentUserId) {
      throw new ForbiddenException(
        'Only the owner of the comment can delete it.',
      );
    }

    await prisma.communityTaskThreadMessageEntity.delete({
      where: { id: commentId },
    });

    this.logger.info({
      action: 'COMMUNITY_TASK_COMMENT_DELETED',
      communityId: comment.task.communityId,
      userId: currentUserId,
      taskId,
      commentId,
    });
  }
}
