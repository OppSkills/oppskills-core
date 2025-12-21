import {
  BadRequestException,
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Patch,
  Put,
  Param,
  Delete,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { EventService } from './event.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import {
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  AddEventRoleDto,
  RemoveEventRoleDto,
} from '@oppskills/types';
import {
  UpdateEventAdditionalInfoDto,
  UpdateEventRegistrationFormDto,
  UpdateEventPrizeBreakdownDto,
  UpdateEventMaxUsersDto,
} from './event-update-nested.dto';

/** Validate that a string ID is non-empty. */
function assertNonEmptyId(id: string, fieldName: string): string {
  if (!id || id.trim().length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }
  return id.trim();
}

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(private readonly eventService: EventService) {}

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD Endpoints
  // ─────────────────────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createEvent(@Body() dto: CreateEventDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    this.logger.log(`Creating event for user: ${userId}`);
    const event = await this.eventService.createEvent(dto, userId);

    return {
      message: 'Event created successfully (DRAFT).',
      data: event,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all events' })
  @ApiQuery({
    name: 'festival_id',
    required: false,
    description: 'Filter events by festival ID',
  })
  @ApiResponse({ status: 200, description: 'List of events' })
  async listEvents(@Query('festival_id') festivalId?: string) {
    return this.eventService.listEvents({ festivalId });
  }

  @Get('my')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'List events where user is owner or manager' })
  @ApiResponse({ status: 200, description: 'List of user events' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listMyEvents(@Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    return this.eventService.listMyEvents(userId);
  }

  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get event by slug' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventBySlug(@Param('slug') slug: string) {
    const validSlug = assertNonEmptyId(slug, 'slug');
    return this.eventService.getEventBySlug(validSlug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event details' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEvent(@Param('id') id: string) {
    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.getEventById(validId);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.updateEvent(validId, dto, userId);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Delete event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async deleteEvent(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.deleteEvent(validId, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Status Endpoint
  // ─────────────────────────────────────────────────────────────────────────────

  @Patch(':id/status')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update event status' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.updateEventStatus(validId, dto.status, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Nested Update Endpoints (DRAFT only)
  // ─────────────────────────────────────────────────────────────────────────────

  @Put(':id/additional-info')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update event additional info (contact + attachments)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Additional info updated' })
  @ApiResponse({ status: 400, description: 'Invalid input or event not in DRAFT' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventAdditionalInfo(
    @Param('id') id: string,
    @Body() dto: UpdateEventAdditionalInfoDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.updateEventAdditionalInfo(validId, dto, userId);
  }

  @Put(':id/registration-form')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update event registration form' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Registration form updated' })
  @ApiResponse({ status: 400, description: 'Invalid input or event not in DRAFT' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventRegistrationForm(
    @Param('id') id: string,
    @Body() dto: UpdateEventRegistrationFormDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.updateEventRegistrationForm(validId, dto, userId);
  }

  @Put(':id/prize-breakdown')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update event prize breakdown' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Prize breakdown updated' })
  @ApiResponse({ status: 400, description: 'Invalid input or event not in DRAFT' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventPrizeBreakdown(
    @Param('id') id: string,
    @Body() dto: UpdateEventPrizeBreakdownDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.updateEventPrizeBreakdown(validId, dto, userId);
  }

  @Put(':id/max-users')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Update event max users limit' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Max users limit updated' })
  @ApiResponse({ status: 400, description: 'Invalid input or event not in DRAFT' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventMaxUsers(
    @Param('id') id: string,
    @Body() dto: UpdateEventMaxUsersDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.updateEventMaxUsers(validId, dto, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Participation Endpoints
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/join')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Join an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Successfully joined event' })
  @ApiResponse({ status: 400, description: 'Cannot join event' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Already joined' })
  async joinEvent(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.joinEvent(validId, userId);
  }

  @Delete(':id/leave')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Leave an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Successfully left event' })
  @ApiResponse({ status: 400, description: 'Cannot leave event' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async leaveEvent(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.leaveEvent(validId, userId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Roles Endpoints
  // ─────────────────────────────────────────────────────────────────────────────

  @Get(':id/roles')
  @ApiOperation({ summary: 'Get event roles' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event roles (owner, managers, evaluators)',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventRoles(@Param('id') id: string) {
    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.getEventRoles(validId);
  }

  @Post(':id/roles')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Add role to event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Role added successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event or user not found' })
  @ApiResponse({ status: 409, description: 'Role already exists' })
  async addEventRole(
    @Param('id') id: string,
    @Body() dto: AddEventRoleDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.addEventRole(validId, dto.email, dto.role, userId);
  }

  @Delete(':id/roles')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Remove role from event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Role removed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event, user, or role not found' })
  async removeEventRole(
    @Param('id') id: string,
    @Body() dto: RemoveEventRoleDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.removeEventRole(
      validId,
      dto.email,
      dto.role,
      userId,
    );
  }
}
