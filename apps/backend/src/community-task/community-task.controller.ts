import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { CommunityTaskService } from './community-task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import {
  TaskResponseDto,
  TaskThreadMessageResponseDto,
} from './dto/task-response.dto';

@ApiTags('Community Tasks')
@ApiBearerAuth('clerk-auth')
@Controller('communities/:communityId/tasks')
@UseGuards(ClerkAuthGuard)
export class CommunityTaskController {
  constructor(private readonly taskService: CommunityTaskService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a community task',
    description:
      'Creates a task in the specified community and optionally sends a welcome notification to the assignee.',
  })
  @ApiBody({ type: CreateTaskDto })
  @ApiResponse({ status: 201, type: TaskResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden due to hierarchy restrictions',
  })
  async createTask(
    @Param('communityId') communityId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.taskService.createTask(userId, communityId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List tasks in community',
    description: 'Lists all tasks associated with the specified community.',
  })
  @ApiResponse({ status: 200, type: [TaskResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listTasks(
    @Param('communityId') communityId: string,
    @Req() req: Request,
  ): Promise<TaskResponseDto[]> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.taskService.listTasks(userId, communityId);
  }

  @Get(':taskId')
  @ApiOperation({
    summary: 'Get community task with comments thread',
    description:
      'Retrieves full details of a community task along with its comments thread.',
  })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTask(
    @Param('taskId') taskId: string,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.taskService.getTask(userId, taskId);
  }

  @Post(':taskId/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a comment/message to the task thread',
    description:
      'Adds a thread comment. Supported message types: TEXT, IMAGE, VIDEO, DOCUMENT. Attachments can be linked with file details.',
  })
  @ApiBody({ type: CreateCommentDto })
  @ApiResponse({ status: 201, type: TaskThreadMessageResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createComment(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ): Promise<TaskThreadMessageResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.taskService.createComment(userId, taskId, dto);
  }

  @Patch(':taskId/status')
  @ApiOperation({
    summary: 'Update task status',
    description:
      'Changes the status of a community task. Only assigner can approve/complete or reject/cancel.',
  })
  @ApiBody({ type: UpdateTaskStatusDto })
  @ApiResponse({ status: 200, type: TaskResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async updateStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: Request,
  ): Promise<TaskResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.taskService.updateTaskStatus(userId, taskId, dto);
  }

  @Delete(':taskId/comments/:commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a comment/message from the task thread',
    description: 'Deletes a thread comment by its owner.',
  })
  @ApiResponse({ status: 204, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async deleteComment(
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Req() req: Request,
  ): Promise<void> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.taskService.deleteComment(userId, taskId, commentId);
  }
}
