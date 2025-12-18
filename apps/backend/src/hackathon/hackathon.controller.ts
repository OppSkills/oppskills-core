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
  UpdateHackathonQuestionsDto,
  UpdateHackathonAdditionalInfoDto,
  RegistrationFormDto,
} from '@oppskills/types';
import { Logger } from '../_utils/logger';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { HackathonService } from './hackathon.service';
import {
  UpdateHackathonPrizeBreakdownDto,
  UpdateHackathonRegistrationFormDto,
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
  @ApiResponse({ status: 201, description: 'Hackathon created successfully' })
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
  })
  @ApiResponse({
    status: 200,
    description: 'List of hackathons retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listHackathons(@Query('festival_id') festivalId?: string) {
    return this.hackathonService.listHackathons({ festivalId });
  }

  @Get('by-slug/:slug')
  @ApiOperation({
    summary: 'Get hackathon by slug',
    description:
      'Retrieve detailed information about a specific hackathon by its slug',
  })
  @ApiParam({ name: 'slug', description: 'Hackathon slug' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getHackathonBySlug(@Param('slug') slug: string) {
    const safeSlug = assertNonEmptyId(slug, 'slug');
    return this.hackathonService.getHackathonBySlug(safeSlug);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get hackathon by ID',
    description: 'Retrieve detailed information about a specific hackathon',
  })
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiResponse({
    status: 200,
    description: 'Hackathon details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonDto })
  @ApiResponse({ status: 200, description: 'Hackathon updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiResponse({ status: 200, description: 'Hackathon deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiResponse({
    status: 201,
    description: 'Successfully registered for hackathon',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Already registered or registration closed',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonRoundsDto })
  @ApiResponse({ status: 200, description: 'Rounds updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
   * Replace all application questions of a hackathon.
   * - Owner-only (or admin).
   * - Allowed only when status is DRAFT.
   */
  @Put(':id/questions')
  @ApiOperation({
    summary: 'Update hackathon questions',
    description:
      'Replace all application questions for a hackathon. Only allowed in DRAFT status. Owner only.',
  })
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonQuestionsDto })
  @ApiResponse({ status: 200, description: 'Questions updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateHackathonQuestions(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonQuestionsDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    this.logger.log(
      `Updating questions for hackathon=${safeId} by userId=${userId}`,
    );

    const hackathon = await this.hackathonService.updateHackathonQuestions(
      safeId,
      dto,
      userId,
    );
    return {
      message: 'Hackathon questions updated successfully.',
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
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonAdditionalInfoDto })
  @ApiResponse({
    status: 200,
    description: 'Additional info updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonRegistrationFormDto })
  @ApiResponse({
    status: 200,
    description: 'Registration form updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiBody({ type: UpdateHackathonPrizeBreakdownDto })
  @ApiResponse({
    status: 200,
    description: 'Prize breakdown updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or not in DRAFT status',
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
}
