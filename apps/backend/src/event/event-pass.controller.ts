import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { EventPassService } from './event-pass.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import {
  ScanEventPassDto,
  ScanResultDto,
  EventPassDto,
  PublicPassLookupDto,
} from '@oppskills/types';
import { EventService } from './event.service';

@ApiTags('Event Passes')
@Controller('event-pass')
export class EventPassController {
  private readonly logger = new Logger(EventPassController.name);

  constructor(
    private readonly eventPassService: EventPassService,
    private readonly eventService: EventService,
  ) {}

  /**
   * GET /event-pass/lookup/:token
   * Protected lookup - returns pass details only for event organizers/managers
   */
  @Get('lookup/:token')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Protected pass lookup by token',
    description: 'Returns pass details. Requires authentication and organizer/manager permissions for the associated event.',
  })
  @ApiParam({
    name: 'token',
    description: 'Pass token from QR code URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Pass details',
    type: Object as any,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User is not an organizer of the event',
  })
  @ApiResponse({
    status: 404,
    description: 'Pass not found',
  })
  async lookupPassByToken(
    @Param('token') token: string,
    @Req() req: Request,
  ): Promise<PublicPassLookupDto> {
    const userId = (req as any).user.id;
    
    // 1. Get the pass info (needs eventId to check permissions)
    const passInfo = await this.eventPassService.lookupPassByToken(token);
    if (!passInfo) {
      throw new NotFoundException('Pass not found');
    }

    // 2. Verify user has permission for this specific event
    try {
      await this.eventService.getEventByIdForDashboard(passInfo.eventId, userId);
    } catch (err) {
      this.logger.warn(`User ${userId} attempted to lookup pass ${token} without permission`);
      throw err; // Will be ForbiddenException from getEventByIdForDashboard
    }

    return passInfo;
  }

  /**
   * GET /event-pass/my-passes
   * Get all passes for authenticated user
   */
  @Get('my-passes')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Get all event passes for authenticated user',
    description: 'Returns all event passes owned by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of event passes',
    type: [Object] as any,
  })
  async getMyPasses(@Req() req: Request): Promise<EventPassDto[]> {
    const userId = (req as any).user.id;
    return this.eventPassService.getPassesByUserId(userId);
  }

  /**
   * GET /event-pass/:passId
   * Get specific pass details (authenticated, user must own the pass)
   */
  @Get(':passId')
  @ApiBearerAuth()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Get event pass by ID',
    description: 'Returns event pass details. User must own the pass.',
  })
  @ApiParam({
    name: 'passId',
    description: 'Event pass ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Event pass details',
    type: Object as any,
  })
  @ApiResponse({
    status: 404,
    description: 'Event pass not found',
  })
  async getPassById(
    @Param('passId') passId: string,
    @Req() req: Request,
  ): Promise<EventPassDto> {
    const userId = (req as any).user.id;
    return this.eventPassService.getPassById(passId, userId);
  }
}

@ApiTags('Events')
@ApiBearerAuth()
@Controller('events')
export class EventPassScanController {
  private readonly logger = new Logger(EventPassScanController.name);

  constructor(
    private readonly eventPassService: EventPassService,
    private readonly eventService: EventService,
  ) {}

  /**
   * POST /events/:eventId/passes/scan
   * Scan/validate pass token
   * Authorization: Only event owner/managers
   */
  @Post(':eventId/passes/scan')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Scan and validate event pass token',
    description:
      'Validates a pass token, marks it as used if not already used, and returns participant details. Only event owners and managers can scan passes.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Scan result with participant details',
    type: Object as any,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid token or pass does not belong to event',
  })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized to scan passes for this event',
  })
  @ApiResponse({
    status: 404,
    description: 'Event or pass not found',
  })
  async scanPass(
    @Param('eventId') eventId: string,
    @Body() dto: ScanEventPassDto,
    @Req() req: Request,
  ): Promise<ScanResultDto> {
    const scannerId = (req as any).user.id;

    // Verify user has permission (owner/manager)
    await this.eventService.getEventByIdForDashboard(eventId, scannerId);

    return this.eventPassService.validateAndScanPass(
      dto.token,
      scannerId,
      eventId,
    );
  }

  /**
   * GET /events/:eventId/passes/scanned
   * Get all scanned passes for event (for organizer dashboard)
   */
  @Get(':eventId/passes/scanned')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Get all scanned passes for an event',
    description:
      'Returns all passes that have been scanned for the event. Only event owners and managers can access this.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'Event ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of scanned passes',
    type: [Object] as any,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not authorized to view scanned passes for this event',
  })
  @ApiResponse({
    status: 404,
    description: 'Event not found',
  })
  async getScannedPasses(
    @Param('eventId') eventId: string,
    @Req() req: Request,
  ): Promise<EventPassDto[]> {
    const userId = (req as any).user.id;

    // Verify user has permission (owner/manager)
    await this.eventService.getEventByIdForDashboard(eventId, userId);

    // Get scanned passes from service
    return this.eventPassService.getScannedPasses(eventId);
  }
}
