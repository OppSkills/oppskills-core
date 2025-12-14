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
} from '@oppskills/types';
import { Logger } from '../_utils/logger';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { HackathonService } from './hackathon.service';

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
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('id is required.');
    }
    return this.hackathonService.getHackathonById(id);
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

    if (!id || id.trim().length === 0) {
      throw new BadRequestException('id is required.');
    }

    return this.hackathonService.updateHackathon(id, dto, userId);
  }

  @Delete(':id')
  async deleteHackathon(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.hackathonService.deleteHackathon(id, userId);
  }

  @Patch(':id/status')
  async updateHackathonStatus(
    @Param('id') id: string,
    @Body() dto: UpdateHackathonStatusDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('id is required.');
    }
    return this.hackathonService.updateHackathonStatus(id, dto.status, userId);
  }

  @Post(':id/register')
  async registerForHackathon(
    @Param('id') hackathonId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.hackathonService.registerForHackathon(hackathonId, userId);
  }
}
