import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { CreateNotificationDto } from '@oppskills/types';
import { NotificationService } from './notification.service';

function assertNonEmptyId(id: string, fieldName: string): string {
  if (!id || id.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }
  return id.trim();
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('schedule')
  @ApiOperation({
    summary: 'Schedule/Request a new notification for an event or hackathon',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification scheduled successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid payload provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async scheduleNotification(
    @Body() dto: CreateNotificationDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    return this.notificationService.scheduleNotification(dto, userId);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'List all notifications for an event' })
  @ApiResponse({ status: 200, description: 'List of event notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listNotificationsForEvent(
    @Param('eventId') eventId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validEventId = assertNonEmptyId(eventId, 'eventId');
    return this.notificationService.listNotificationsForEvent(
      validEventId,
      userId,
    );
  }

  @Get('hackathon/:hackathonId')
  @ApiOperation({ summary: 'List all notifications for a hackathon' })
  @ApiResponse({ status: 200, description: 'List of hackathon notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listNotificationsForHackathon(
    @Param('hackathonId') hackathonId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validHackathonId = assertNonEmptyId(hackathonId, 'hackathonId');
    return this.notificationService.listNotificationsForHackathon(
      validHackathonId,
      userId,
    );
  }

  @Get('community/:communityId/audience-count')
  @ApiOperation({ summary: 'Count recipients for a community mail audience' })
  @ApiResponse({ status: 200, description: 'Audience recipient count' })
  async getCommunityAudienceCount(
    @Param('communityId') communityId: string,
    @Query('audience') audience: string | undefined,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validCommunityId = assertNonEmptyId(communityId, 'communityId');
    return this.notificationService.getCommunityAudienceCount(
      validCommunityId,
      audience,
      userId,
    );
  }

  @Get('community/:communityId')
  @ApiOperation({ summary: 'List all notifications for a community' })
  @ApiResponse({ status: 200, description: 'List of community notifications' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listNotificationsForCommunity(
    @Param('communityId') communityId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validCommunityId = assertNonEmptyId(communityId, 'communityId');
    return this.notificationService.listNotificationsForCommunity(
      validCommunityId,
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a notification details by its ID' })
  @ApiResponse({ status: 200, description: 'Notification details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotificationById(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validId = assertNonEmptyId(id, 'id');
    return this.notificationService.getNotificationById(validId, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete or cancel a notification by its ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validId = assertNonEmptyId(id, 'id');
    return this.notificationService.deleteNotification(validId, userId);
  }
}
