import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Patch,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CreateFestivalDto,
  UpdateFestivalDto,
  UpdateFestivalStatusDto,
} from '@oppskills/types';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { FestivalService } from './festival.service';

@Controller('festivals')
@UseGuards(ClerkAuthGuard)
export class FestivalController {
  constructor(private readonly festivalService: FestivalService) {}

  @Post()
  async createFestival(@Body() dto: CreateFestivalDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.festivalService.createFestival(dto, userId);
  }

  @Get()
  async listFestivals() {
    return this.festivalService.listFestivals();
  }

  @Get(':id')
  async getFestival(@Param('id') id: string) {
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.getFestivalById(id);
  }

  @Put(':id')
  async updateFestival(
    @Param('id') id: string,
    @Body() dto: UpdateFestivalDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.updateFestival(id, dto, userId);
  }

  @Delete(':id')
  async deleteFestival(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.deleteFestival(id, userId);
  }

  @Patch(':id/status')
  async updateFestivalStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFestivalStatusDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.updateFestivalStatus(id, dto.status, userId);
  }

  @Get(':id/hackathons')
  async getFestivalHackathons(@Param('id') id: string) {
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.getHackathonsUnderFestival(id);
  }
}
