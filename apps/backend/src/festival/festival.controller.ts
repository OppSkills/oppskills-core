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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  CreateFestivalDto,
  UpdateFestivalDto,
  UpdateFestivalStatusDto,
} from '@oppskills/types';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { FestivalService } from './festival.service';

@ApiTags('Festivals')
@ApiBearerAuth('clerk-auth')
@Controller('festivals')
@UseGuards(ClerkAuthGuard)
export class FestivalController {
  constructor(private readonly festivalService: FestivalService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new festival', description: 'Create a new festival event. Requires authentication.' })
  @ApiBody({ type: CreateFestivalDto })
  @ApiResponse({ status: 201, description: 'Festival created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  async createFestival(@Body() dto: CreateFestivalDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.festivalService.createFestival(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List all festivals', description: 'Retrieve a list of all festivals' })
  @ApiResponse({ status: 200, description: 'List of festivals retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listFestivals() {
    return this.festivalService.listFestivals();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get festival by ID', description: 'Retrieve detailed information about a specific festival' })
  @ApiParam({ name: 'id', description: 'Festival ID' })
  @ApiResponse({ status: 200, description: 'Festival details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFestival(@Param('id') id: string) {
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.getFestivalById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update festival', description: 'Update festival details. Only the owner can perform this action.' })
  @ApiParam({ name: 'id', description: 'Festival ID' })
  @ApiBody({ type: UpdateFestivalDto })
  @ApiResponse({ status: 200, description: 'Festival updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Delete festival', description: 'Delete a festival. Only the owner can perform this action.' })
  @ApiParam({ name: 'id', description: 'Festival ID' })
  @ApiResponse({ status: 200, description: 'Festival deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteFestival(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.deleteFestival(id, userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update festival status', description: 'Change festival lifecycle status (DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED). Owner only.' })
  @ApiParam({ name: 'id', description: 'Festival ID' })
  @ApiBody({ type: UpdateFestivalStatusDto })
  @ApiResponse({ status: 200, description: 'Status updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({ summary: 'Get festival hackathons', description: 'Retrieve all hackathons associated with a specific festival' })
  @ApiParam({ name: 'id', description: 'Festival ID' })
  @ApiResponse({ status: 200, description: 'List of hackathons retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getFestivalHackathons(@Param('id') id: string) {
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.getHackathonsUnderFestival(id);
  }
}
