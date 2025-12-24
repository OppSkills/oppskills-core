import {
  BadRequestException,
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  UnauthorizedException,
  Patch,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  CreateHackathonDto,
  UpdateHackathonDto,
  UpdateHackathonStatusDto,
  UpdateHackathonRoundsDto,
  UpdateHackathonAdditionalInfoDto,
  RegistrationFormDto,
  AddHackathonRoleDto,
  RemoveHackathonRoleDto,
} from '@oppskills/types';
import { Logger } from '../_utils/logger';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { HackathonService } from './hackathon.service';
import {
  UpdateHackathonPrizeBreakdownDto,
  UpdateHackathonRegistrationFormDto,
  UpdateHackathonMaxTeamsDto,
} from './hackathon-update-nested.dto';

function assertNonEmptyId(id: string, fieldName: string): string {
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }
  return trimmed;
}

@ApiTags('Hackathons')
@ApiBearerAuth('clerk-auth')
@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class HackathonController {
  private readonly logger = new Logger(HackathonController.name);

  constructor(private readonly hackathonService: HackathonService) {}

  /**
   * Create a hackathon as a user.
   * - Always creates as DRAFT.
   */
  @Post()
  @ApiOperation({
    summary: 'Create a new hackathon',
    description:
      'Creates a new hackathon in DRAFT status. Requires authentication.',
  })
  @ApiBody({ type: CreateHackathonDto })
  @ApiResponse({
    status: 201,
    description: 'Hackathon created successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hackathon created successfully (DRAFT).',
        },
        data: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            name: { type: 'string', example: 'Tech Innovation Hackathon 2025' },
            slug: { type: 'string', example: 'tech-innovation-2025' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
              example: 'DRAFT',
            },
            organizerId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  async createHackathon(@Body() dto: CreateHackathonDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    this.logger.log(`Creating hackathon by userId=${userId}`);

    const hackathon = await this.hackathonService.createHackathon(dto, userId);
    return {
      message: 'Hackathon created successfully (DRAFT).',
      data: hackathon,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'List all hackathons',
    description:
      'Retrieve a list of hackathons, optionally filtered by festival ID',
  })
  @ApiQuery({
    name: 'festival_id',
    required: false,
    description: 'Filter hackathons by festival ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'List of hackathons retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          description: { type: 'string' },
          status: {
            type: 'string',
            enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
          },
          mode: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'HYBRID'] },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          bannerImageUrl: { type: 'string', format: 'uri' },
          festivalId: { type: 'string', format: 'uuid', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async listHackathons(@Query('festival_id') festivalId?: string) {
    return this.hackathonService.listHackathons({ festivalId });
  }

  /**
   * List hackathons visible in the dashboard for the authenticated user.
   * - Includes hackathons the user OWNS
   * - Includes hackathons where the user is a MANAGER
   *
   * Note: Evaluators are intentionally excluded (read-only future feature).
   */
  @Get('my')
  @ApiOperation({
    summary: 'List my hackathons (owner or manager)',
    description:
      'Retrieve hackathons where the authenticated user is the owner or a manager.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of hackathons retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async listMyHackathons(@Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.hackathonService.listMyHackathons(userId);
  }

  @Get('by-slug/:slug')
  @ApiOperation({
    summary: 'Get hackathon by slug',
    description:
      'Retrieve detailed information about a specific hackathon by its slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Hackathon slug',
    type: 'string',
    example: 'tech-innovation-2025',
  })
  @ApiResponse({
    status: 200,
    description: 'Hackathon details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        mode: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        rounds: { type: 'array', items: { type: 'object' } },
        prizeBreakdown: { type: 'array', items: { type: 'object' } },
        location: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getHackathonBySlug(@Param('slug') slug: string) {
    const safeSlug = assertNonEmptyId(slug, 'slug');
    return this.hackathonService.getHackathonBySlug(safeSlug);
  }

  @Get('by-slug/:slug/registrations')
  @ApiOperation({
    summary: 'Get hackathon team registrations by slug',
    description:
      'Retrieve all team registrations for a hackathon. Owner/Manager/Admin only.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Hackathon slug',
    type: 'string',
    example: 'tech-innovation-2025',
  })
  @ApiResponse({
    status: 200,
    description: 'Hackathon registrations retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        hackathonId: { type: 'string', format: 'uuid' },
        rounds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              order: { type: 'number' },
              roundType: { type: 'string' },
              startsAt: { type: 'string', format: 'date-time' },
              endsAt: { type: 'string', format: 'date-time' },
              status: { type: 'string' },
            },
          },
        },
        teams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              teamId: { type: 'string', format: 'uuid' },
              teamName: { type: 'string' },
              memberCount: { type: 'number' },
              maxSize: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              leader: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  imageUrl: { type: 'string' },
                  university: { type: 'string' },
                  location: { type: 'string' },
                },
              },
              roundSubmissions: { type: 'object' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Owner/Manager/Admin only',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  async getHackathonRegistrationsBySlug(
    @Param('slug') slug: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeSlug = assertNonEmptyId(slug, 'slug');
    return this.hackathonService.listHackathonRegistrationsBySlug(
      safeSlug,
      userId,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get hackathon by ID',
    description: 'Retrieve detailed information about a specific hackathon',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Hackathon details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        slug: { type: 'string' },
        description: { type: 'string' },
        status: { type: 'string' },
        mode: { type: 'string' },
        visibility: { type: 'string' },
        hackathonType: { type: 'string' },
        participantType: { type: 'string' },
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        registrationDeadline: { type: 'string', format: 'date-time' },
        bannerImageUrl: { type: 'string', format: 'uri' },
        location: { type: 'object' },
        rounds: { type: 'array', items: { type: 'object' } },
        prizeBreakdown: { type: 'array', items: { type: 'object' } },
        registrationForm: { type: 'object' },
        additionalInfo: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getHackathon(@Param('id') id: string) {
    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.getHackathonById(safeId);
  }

  /** Update a hackathon (owner-only). */
  @Put(':id')
  @ApiOperation({
    summary: 'Update hackathon',
    description:
      'Update hackathon details. Only the owner can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateHackathonDto })
  @ApiResponse({
    status: 200,
    description: 'Hackathon updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        status: { type: 'string' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateHackathon(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.updateHackathon(safeId, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete hackathon',
    description: 'Delete a hackathon. Only the owner can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Hackathon deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Hackathon deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async deleteHackathon(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.deleteHackathon(safeId, userId);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update hackathon status',
    description:
      'Change hackathon lifecycle status (DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED). Owner only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateHackathonStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Status updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: {
          type: 'string',
          enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
        },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateHackathonStatus(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonStatusDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.updateHackathonStatus(
      safeId,
      dto.status,
      userId,
    );
  }

  @Post(':id/register')
  @ApiOperation({
    summary: 'Register for hackathon',
    description: 'Register the authenticated user for a specific hackathon',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully registered for hackathon',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Successfully registered for hackathon',
        },
        registrationId: { type: 'string', format: 'uuid' },
        hackathonId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Already registered or registration closed',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async registerForHackathon(
    @Param('id') hackathonId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(hackathonId, 'id');
    return this.hackathonService.registerForHackathon(safeId, userId);
  }

  /**
   * Replace all rounds of a hackathon.
   * - Owner-only (or admin).
   * - Allowed only when status is DRAFT.
   */
  @Put(':id/rounds')
  @ApiOperation({
    summary: 'Update hackathon rounds',
    description:
      'Replace all rounds of a hackathon. Only allowed in DRAFT status. Owner only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateHackathonRoundsDto })
  @ApiResponse({
    status: 200,
    description: 'Rounds updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hackathon rounds updated successfully.',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            rounds: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateHackathonRounds(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonRoundsDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    this.logger.log(
      `Updating rounds for hackathon=${safeId} by userId=${userId}`,
    );

    const hackathon = await this.hackathonService.updateHackathonRounds(
      safeId,
      dto,
      userId,
    );
    return {
      message: 'Hackathon rounds updated successfully.',
      data: hackathon,
    };
  }

  /**
   * Update additional info (contact + attachments) of a hackathon.
   * - Owner-only (or admin).
   * - Allowed only when status is DRAFT.
   */
  @Put(':id/additional-info')
  @ApiOperation({
    summary: 'Update hackathon additional info',
    description:
      'Update contact information and attachments for a hackathon. Only allowed in DRAFT status. Owner only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateHackathonAdditionalInfoDto })
  @ApiResponse({
    status: 200,
    description: 'Additional info updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hackathon additional info updated successfully.',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            additionalInfo: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateHackathonAdditionalInfo(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonAdditionalInfoDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    this.logger.log(
      `Updating additional info for hackathon=${safeId} by userId=${userId}`,
    );

    const hackathon = await this.hackathonService.updateHackathonAdditionalInfo(
      safeId,
      dto,
      userId,
    );
    return {
      message: 'Hackathon additional info updated successfully.',
      data: hackathon,
    };
  }

  /**
   * Replace the registration form (external form link OR internal fields).
   * - Owner-only (or admin).
   * - Allowed only when status is DRAFT.
   */
  @Put(':id/registration-form')
  @ApiOperation({
    summary: 'Update hackathon registration form',
    description:
      'Replace the registration form for a hackathon. Only allowed in DRAFT status. Owner only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateHackathonRegistrationFormDto })
  @ApiResponse({
    status: 200,
    description: 'Registration form updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hackathon registration form updated successfully.',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            registrationForm: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateHackathonRegistrationForm(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonRegistrationFormDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(id, 'id');

    const safeForm: RegistrationFormDto = dto.registrationForm;
    const hackathon =
      await this.hackathonService.updateHackathonRegistrationForm(
        safeId,
        safeForm,
        userId,
      );

    return {
      message: 'Hackathon registration form updated successfully.',
      data: hackathon,
    };
  }

  /**
   * Replace the prize breakdown list of a hackathon.
   * - Owner-only (or admin).
   * - Allowed only when status is DRAFT.
   */
  @Put(':id/prize-breakdown')
  @ApiOperation({
    summary: 'Update hackathon prize breakdown',
    description:
      'Replace the prize breakdown list for a hackathon. Only allowed in DRAFT status. Owner only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateHackathonPrizeBreakdownDto })
  @ApiResponse({
    status: 200,
    description: 'Prize breakdown updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hackathon prize breakdown updated successfully.',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            prizeBreakdown: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateHackathonPrizeBreakdown(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonPrizeBreakdownDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(id, 'id');

    const hackathon = await this.hackathonService.updateHackathonPrizeBreakdown(
      safeId,
      dto,
      userId,
    );
    return {
      message: 'Hackathon prize breakdown updated successfully.',
      data: hackathon,
    };
  }

  /**
   * Update the max teams limit.
   * - Owner-only (or admin).
   * - Allowed only when status is DRAFT.
   * - `null` means unlimited.
   */
  @Put(':id/max-teams')
  @ApiOperation({
    summary: 'Update max teams',
    description:
      'Update the max teams limit for a hackathon. Only allowed in DRAFT status. Owner only. Use null for unlimited.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateHackathonMaxTeamsDto })
  @ApiResponse({
    status: 200,
    description: 'Max teams updated successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Hackathon max teams updated successfully.',
        },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            maxTeams: { type: 'number', nullable: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateHackathonMaxTeams(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonMaxTeamsDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(id, 'id');
    const hackathon = await this.hackathonService.updateHackathonMaxTeams(
      safeId,
      dto.maxTeams ?? null,
      userId,
    );
    return {
      message: 'Hackathon max teams updated successfully.',
      data: hackathon,
    };
  }

  // =====================
  // Role Management
  // =====================

  /**
   * Get all roles for a hackathon (owner + managers + evaluators).
   */
  @Get(':id/roles')
  @ApiOperation({
    summary: 'Get hackathon roles',
    description:
      'Retrieve all roles for a hackathon including owner, managers, and evaluators.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        owner: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            imageUrl: { type: 'string' },
          },
        },
        managers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              imageUrl: { type: 'string' },
              role: { type: 'string', enum: ['MANAGER', 'EVALUATOR'] },
              assignedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
        evaluators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              firstName: { type: 'string' },
              lastName: { type: 'string' },
              imageUrl: { type: 'string' },
              role: { type: 'string', enum: ['MANAGER', 'EVALUATOR'] },
              assignedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getHackathonRoles(@Param('id') id: string) {
    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.getHackathonRoles(safeId);
  }

  /**
   * Add a role to a hackathon (owner/admin only).
   */
  @Post(':id/roles')
  @ApiOperation({
    summary: 'Add hackathon role',
    description:
      'Add a manager or evaluator to a hackathon. Only the owner or admin can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: AddHackathonRoleDto })
  @ApiResponse({
    status: 201,
    description: 'Role added successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        alreadyExists: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - User not found or invalid input',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only owner or admin can add roles',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async addHackathonRole(
    @Param('id') id: string,
    @Body() dto: AddHackathonRoleDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    this.logger.log(
      `Adding role ${dto.role} for hackathon=${safeId} by userId=${userId}`,
    );

    return this.hackathonService.addHackathonRole(
      safeId,
      dto.email,
      dto.role,
      userId,
    );
  }

  /**
   * Remove a role from a hackathon (owner/admin only).
   */
  @Delete(':id/roles')
  @ApiOperation({
    summary: 'Remove hackathon role',
    description:
      'Remove a manager or evaluator from a hackathon. Only the owner or admin can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({ type: RemoveHackathonRoleDto })
  @ApiResponse({
    status: 200,
    description: 'Role removed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - User not found or invalid input',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only owner or admin can remove roles',
  })
  @ApiResponse({ status: 404, description: 'Hackathon or role not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async removeHackathonRole(
    @Param('id') id: string,
    @Body() dto: RemoveHackathonRoleDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    this.logger.log(
      `Removing role ${dto.role} for hackathon=${safeId} by userId=${userId}`,
    );

    return this.hackathonService.removeHackathonRole(
      safeId,
      dto.email,
      dto.role,
      userId,
    );
  }

  // =====================
  // Approval & Registration Control
  // =====================

  @Post(':id/submit-for-approval')
  @ApiOperation({
    summary: 'Submit hackathon for approval',
    description:
      'Submit a hackathon for admin approval. Sets status to PUBLISHED and approvalStatus to PENDING.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Hackathon submitted for approval',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        status: { type: 'string' },
        approvalStatus: { type: 'string' },
        approvalSubmittedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not allowed to submit this hackathon',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async submitForApproval(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.submitForApproval(safeId, userId);
  }

  @Patch(':id/registration-paused')
  @ApiOperation({
    summary: 'Update registration paused status',
    description:
      'Pause or resume registrations for a hackathon. Owner, admin, or manager only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Hackathon ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        isRegistrationPaused: { type: 'boolean' },
      },
      required: ['isRegistrationPaused'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Registration paused status updated',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        isRegistrationPaused: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not allowed to modify this hackathon',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async updateRegistrationPaused(
    @Param('id') id: string,
    @Body() body: { isRegistrationPaused: boolean },
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.updateRegistrationPaused(
      safeId,
      body.isRegistrationPaused,
      userId,
    );
  }
}
