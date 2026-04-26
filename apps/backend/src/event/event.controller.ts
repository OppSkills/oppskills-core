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
  ParseArrayPipe,
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
  SubmitForApprovalDto,
  UpdateApprovalStatusDto,
  UpdateEventRegistrationPausedDto,
  JoinEventDto,
} from '@oppskills/types';
import {
  UpdateEventAdditionalInfoDto,
  UpdateEventRegistrationFormDto,
  UpdateEventPrizeBreakdownDto,
  UpdateEventMaxUsersDto,
} from './event-update-nested.dto';
import { HackathonService } from '../hackathon/hackathon.service';

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

  constructor(
    private readonly eventService: EventService,
    private readonly hackathonService: HackathonService,
  ) { }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC Endpoints (no auth required) - sanitized data only
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * GET /events/public - List public events (PUBLISHED + APPROVED only).
   * Returns sanitized data without participants or roles.
   */
  @Get('public')
  @ApiOperation({
    summary: 'List public events (PUBLISHED/ONGOING + APPROVED only)',
  })
  @ApiQuery({
    name: 'modes',
    required: false,
    description: 'Filter by modes (Online, In Person)',
    type: [String],
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status (Upcoming, Recent)',
    type: [String],
  })
  @ApiQuery({
    name: 'eventDates',
    required: false,
    description: 'Filter by event dates (This week, Next week, etc.)',
    type: [String],
  })
  @ApiQuery({
    name: 'eligibility',
    required: false,
    description: 'Filter by eligibility (School, UG, PG, Open)',
    type: [String],
  })
  @ApiQuery({
    name: 'festival_id',
    required: false,
    description: 'Filter events by festival ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default 1)',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of results to return (10, 20, 30, 40)',
    type: Number,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    description: 'Sort by (most_relevant, recently_added, price_amount, submission_date)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of public events (sanitized)',
  })
  async listPublicEvents(
    @Query('festival_id') festivalId?: string,
    @Query('page') page?: number,
    @Query('take') take?: number,
    @Query('q') search?: string,
    @Query('modes', new ParseArrayPipe({ items: String, optional: true }))
    modes?: string[],
    @Query('status', new ParseArrayPipe({ items: String, optional: true }))
    status?: string[],
    @Query('eventDates', new ParseArrayPipe({ items: String, optional: true }))
    eventDates?: string[],
    @Query('eligibility', new ParseArrayPipe({ items: String, optional: true }))
    eligibility?: string[],
    @Query('sort') sort?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.eventService.listPublicEvents({
      festivalId,
      page,
      take,
      search,
      modes,
      status,
      eventDates,
      eligibility,
      sort,
      sortOrder,
    });
  }

  /**
   * GET /events/public/upcoming - List upcoming public events.
   * Registration deadline is in the future or not set.
   */
  @Get('public/upcoming')
  @ApiOperation({
    summary: 'List upcoming public events (Deadline > Now or Null)',
  })
  @ApiQuery({
    name: 'festival_id',
    required: false,
    description: 'Filter events by festival ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of results to return (10, 20, 30, 40)',
    type: Number,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'List of upcoming public events' })
  async listPublicUpcomingEvents(
    @Query('festival_id') festivalId?: string,
    @Query('page') page?: number,
    @Query('take') take?: number,
    @Query('q') search?: string,
  ) {
    return this.eventService.listPublicEvents({
      festivalId,
      page,
      take,
      search,
      filterMode: 'UPCOMING',
    });
  }


  /**
   * GET /events/public/by-slug/:slug - Get public event by slug.
   * Returns sanitized data without participants, roles, or registrant PII.
   */
  @Get('public/by-slug/:slug')
  @ApiOperation({ summary: 'Get public event by slug (sanitized, no PII)' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 200, description: 'Public event details (sanitized)' })
  @ApiResponse({
    status: 404,
    description: 'Event not found or not publicly visible',
  })
  async getPublicEventBySlug(@Param('slug') slug: string) {
    const validSlug = assertNonEmptyId(slug, 'slug');
    return this.eventService.getPublicEventBySlug(validSlug);
  }

  /**
   * GET /events/public/:id - Get public event by ID.
   * Returns sanitized data without participants, roles, or registrant PII.
   */
  @Get('public/:id')
  @ApiOperation({ summary: 'Get public event by ID (sanitized, no PII)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Public event details (sanitized)' })
  @ApiResponse({
    status: 404,
    description: 'Event not found or not publicly visible',
  })
  async getPublicEvent(@Param('id') id: string) {
    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.getPublicEventById(validId);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CRUD Endpoints (auth required for dashboard)
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
    // This endpoint is used for public listings - delegates to listPublicEvents
    return this.eventService.listPublicEvents({ festivalId });
  }

  @Get('my')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'List events where user is owner or manager' })
  @ApiResponse({ status: 200, description: 'List of user events' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listMyEvents(
    @Req() req: Request,
    @Query('page') page?: number,
    @Query('take') take?: number,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    return this.eventService.listMyEvents(userId, { page, take });
  }

  /**
   * GET /events/by-slug/:slug - Dashboard endpoint (auth required).
   * Returns full event data including participants for owner/manager/admin.
   */
  @Get('by-slug/:slug')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get event by slug (dashboard, auth required)' })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 200, description: 'Full event details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventBySlug(@Param('slug') slug: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validSlug = assertNonEmptyId(slug, 'slug');
    return this.eventService.getEventBySlugForDashboard(validSlug, userId);
  }

  @Get('by-slug/:slug/registrations')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Get event registrations by slug (owner/manager/admin only)',
  })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({ status: 200, description: 'Event registrations list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Owner/Manager/Admin only',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventRegistrationsBySlug(
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validSlug = assertNonEmptyId(slug, 'slug');
    return this.eventService.listEventRegistrationsBySlug(validSlug, userId);
  }

  @Get('by-slug/:slug/registrations/:participantId')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary:
      'Get registration answers for a participant (owner/manager/admin only)',
  })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiParam({ name: 'participantId', description: 'Participant ID' })
  @ApiResponse({ status: 200, description: 'Participant registration answers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Owner/Manager/Admin only',
  })
  @ApiResponse({ status: 404, description: 'Event or participant not found' })
  async getParticipantRegistrationAnswers(
    @Param('slug') slug: string,
    @Param('participantId') participantId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validSlug = assertNonEmptyId(slug, 'slug');
    const validParticipantId = assertNonEmptyId(participantId, 'participantId');
    return this.eventService.getParticipantRegistrationAnswers(
      validSlug,
      validParticipantId,
      userId,
    );
  }

  /**
   * GET /events/:id - Dashboard endpoint (auth required).
   * Returns full event data for owner/manager/admin.
   */
  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get event by ID (dashboard, auth required)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Full event details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEvent(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.getEventByIdForDashboard(validId, userId);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Update event',
    description:
      'Full update while status is DRAFT, PUBLISHED, or ONGOING (not completed/cancelled).',
  })
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
  // Nested Update Endpoints (same lifecycle rules as PUT :id)
  // ─────────────────────────────────────────────────────────────────────────────

  @Put(':id/additional-info')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Update event additional info (contact + attachments)',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Additional info updated' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
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
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
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
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
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
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
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
  @ApiOperation({ summary: 'Join an event with optional registration answers' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 201, description: 'Successfully joined event' })
  @ApiResponse({
    status: 400,
    description: 'Cannot join event or invalid answers',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  @ApiResponse({ status: 409, description: 'Already joined' })
  async joinEvent(
    @Param('id') id: string,
    @Body() dto: JoinEventDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.joinEvent(
      validId,
      userId,
      dto.answers,
      dto.referralCode,
    );
  }

  @Get(':id/my-registration')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Check if current user is registered for an event' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Registration status returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async checkMyRegistration(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.checkUserRegistration(validId, userId);
  }

  @Post(':id/complete-registration')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Submit missing registration answers for paid users',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 201,
    description: 'Registration form submitted successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request (not registered, already submitted, or payment missing)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async submitMissingRegistrationAnswers(
    @Param('id') id: string,
    @Body() dto: JoinEventDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.submitMissingRegistrationAnswers(
      validId,
      userId,
      dto.answers || [],
    );
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

  /**
   * GET /events/:id/roles - Get event roles (auth required, owner/manager/admin only).
   * Returns role assignments including manager/evaluator emails.
   */
  @Get(':id/roles')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({ summary: 'Get event roles (owner/manager/admin only)' })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({
    status: 200,
    description: 'Event roles (owner, managers, evaluators)',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Owner/Manager/Admin only',
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async getEventRoles(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }
    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.getEventRolesWithPermission(validId, userId);
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Approval Workflow Endpoints
  // ─────────────────────────────────────────────────────────────────────────────

  @Post(':id/submit-approval')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Submit event for approval',
    description:
      'Publishes the event. First-time (or post-rejection) publish sets approval to PENDING; if already APPROVED, only lifecycle is updated (no re-review). Requires owner/admin/manager.',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Event submitted for approval' })
  @ApiResponse({ status: 400, description: 'Invalid state' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async submitEventForApproval(
    @Param('id') id: string,
    @Body() dto: SubmitForApprovalDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.submitForApproval(validId, userId, dto.note);
  }

  @Patch(':id/approval')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Update event approval status (admin only)',
    description: 'Approve or reject an event. Admin-only endpoint.',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Approval status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventApprovalStatus(
    @Param('id') id: string,
    @Body() dto: UpdateApprovalStatusDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.updateApprovalStatus(
      validId,
      dto.approvalStatus,
      userId,
      dto.note,
    );
  }

  @Patch(':id/registration')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Pause/unpause event registrations',
    description:
      'Toggle registration pause status. Event remains publicly visible.',
  })
  @ApiParam({ name: 'id', description: 'Event ID' })
  @ApiResponse({ status: 200, description: 'Registration status updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async updateEventRegistrationPaused(
    @Param('id') id: string,
    @Body() dto: UpdateEventRegistrationPausedDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const validId = assertNonEmptyId(id, 'id');
    return this.eventService.updateRegistrationPaused(
      validId,
      dto.isRegistrationPaused,
      userId,
    );
  }

  /**
   * POST /events/by-slug/:slug/participants/:participantId/approve
   * Approve a participant for an event (owner/manager/admin only).
   */
  @Post('by-slug/:slug/participants/:participantId/approve')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Approve a participant for an event (owner/manager/admin only)',
  })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiParam({ name: 'participantId', description: 'Participant ID' })
  @ApiResponse({
    status: 200,
    description: 'Participant approved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event or participant not found' })
  async approveParticipant(
    @Param('slug') slug: string,
    @Param('participantId') participantId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const event = await this.eventService.getEventBySlug(slug);
    await this.eventService.approveParticipant(event.id, participantId, userId);
    return { success: true };
  }

  /**
   * POST /events/by-slug/:slug/participants/bulk-approve
   * Bulk approve participants for an event (owner/manager/admin only).
   */
  @Post('by-slug/:slug/participants/bulk-approve')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Bulk approve participants (owner/manager/admin only)',
  })
  @ApiParam({ name: 'slug', description: 'Event slug' })
  @ApiResponse({
    status: 200,
    description: 'Participants approved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async bulkApproveParticipants(
    @Param('slug') slug: string,
    @Body('participantIds') participantIds: string[],
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new BadRequestException('User ID is required.');
    }

    const event = await this.eventService.getEventBySlug(slug);
    await this.eventService.bulkApproveParticipants(
      event.id,
      participantIds || [],
      userId,
    );
    return { success: true };
  }
}
