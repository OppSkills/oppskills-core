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
import type { Request } from 'express';
import {
  CreateHackathonDto,
  UpdateHackathonDto,
  UpdateHackathonStatusDto,
  UpdateHackathonRoundsDto,
  UpdateHackathonQuestionsDto,
  UpdateHackathonAdditionalInfoDto,
} from '@oppskills/types';
import { Logger } from '../_utils/logger';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { HackathonService } from './hackathon.service';

function assertNonEmptyId(id: string, fieldName: string): string {
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    throw new BadRequestException(`${fieldName} is required.`);
  }
  return trimmed;
}

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
  async listHackathons(@Query('festival_id') festivalId?: string) {
    return this.hackathonService.listHackathons({ festivalId });
  }

  @Get(':id')
  async getHackathon(@Param('id') id: string) {
    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.getHackathonById(safeId);
  }

  /** Update a hackathon (owner-only). */
  @Put(':id')
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
  async deleteHackathon(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    const safeId = assertNonEmptyId(id, 'id');
    return this.hackathonService.deleteHackathon(safeId, userId);
  }

  @Patch(':id/status')
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
  async updateHackathonRounds(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonRoundsDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    this.logger.log(`Updating rounds for hackathon=${safeId} by userId=${userId}`);

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
  async updateHackathonQuestions(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonQuestionsDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    this.logger.log(`Updating questions for hackathon=${safeId} by userId=${userId}`);

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
  async updateHackathonAdditionalInfo(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonAdditionalInfoDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    const safeId = assertNonEmptyId(id, 'id');
    this.logger.log(`Updating additional info for hackathon=${safeId} by userId=${userId}`);

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
}
