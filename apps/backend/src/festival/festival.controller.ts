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
import { UserAccountsService } from '../user-accounts/user-accounts.service';

@ApiTags('Festivals')
@ApiBearerAuth('clerk-auth')
@Controller('festivals')

export class FestivalController {
  constructor(
    private readonly festivalService: FestivalService,
    private readonly userAccountsService: UserAccountsService,
  ) { }

  @Post()
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Create a new festival',
    description: 'Create a new festival event. Requires authentication.',
  })
  @ApiBody({ type: CreateFestivalDto })
  @ApiResponse({
    status: 201,
    description: 'Festival created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        name: { type: 'string', example: 'TechFest 2025' },
        slug: { type: 'string', example: 'tech-fest-2025' },
        status: {
          type: 'string',
          enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'],
          example: 'DRAFT',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2025-01-15T10:00:00Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  async createFestival(@Body() dto: CreateFestivalDto, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');

    // Ensure user exists in our DB
    await this.userAccountsService.getMe({
      userId,
      email: req.user?.email,
    });

    return this.festivalService.createFestival(dto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List all festivals',
    description: 'Retrieve a list of all festivals',
  })
  @ApiResponse({
    status: 200,
    description: 'List of festivals retrieved successfully',
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
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          posterImageUrl: { type: 'string', format: 'uri' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async listFestivals() {
    return this.festivalService.listPublicFestivals();
  }

  @Get('my')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'List user festivals',
    description: 'Retrieve a list of festivals organized by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of user festivals retrieved successfully',
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
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          posterImageUrl: { type: 'string', format: 'uri' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async listUserFestivals(@Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    return this.festivalService.listUserFestivals(userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get festival by ID',
    description: 'Retrieve detailed information about a specific festival',
  })
  @ApiParam({
    name: 'id',
    description: 'Festival ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Festival details retrieved successfully',
    schema: {
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
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        posterImageUrl: { type: 'string', format: 'uri' },
        websiteUrl: { type: 'string', format: 'uri' },
        location: { type: 'object' },
        organizationName: { type: 'string' },
        organizationLogoUrl: { type: 'string', format: 'uri' },
        hackathons: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getFestival(@Param('id') id: string) {
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.getFestivalById(id);
  }

  @Put(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Update festival',
    description:
      'Update festival details. Only the owner can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'Festival ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateFestivalDto })
  @ApiResponse({
    status: 200,
    description: 'Festival updated successfully',
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
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
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
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Delete festival',
    description: 'Delete a festival. Only the owner can perform this action.',
  })
  @ApiParam({
    name: 'id',
    description: 'Festival ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Festival deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Festival deleted successfully' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the owner' })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async deleteFestival(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not found');
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.deleteFestival(id, userId);
  }

  @Patch(':id/status')
  @UseGuards(ClerkAuthGuard)
  @ApiOperation({
    summary: 'Update festival status',
    description:
      'Change festival lifecycle status (DRAFT, PUBLISHED, ONGOING, COMPLETED, CANCELLED). Owner only.',
  })
  @ApiParam({
    name: 'id',
    description: 'Festival ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateFestivalStatusDto })
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
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
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
  @ApiOperation({
    summary: 'Get festival hackathons',
    description: 'Retrieve all hackathons associated with a specific festival',
  })
  @ApiParam({
    name: 'id',
    description: 'Festival ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
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
          status: { type: 'string' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          mode: { type: 'string', enum: ['ONLINE', 'OFFLINE', 'HYBRID'] },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getFestivalHackathons(@Param('id') id: string) {
    if (!id || id.trim().length === 0)
      throw new BadRequestException('id is required.');
    return this.festivalService.getHackathonsUnderFestival(id);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get festival by Slug',
    description: 'Retrieve detailed information about a specific festival by its slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'Festival Slug',
    type: 'string',
    example: 'tech-fest-2025',
  })
  @ApiResponse({
    status: 200,
    description: 'Festival details retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Festival not found' })
  async getFestivalBySlug(@Param('slug') slug: string) {
    if (!slug || slug.trim().length === 0)
      throw new BadRequestException('slug is required.');
    return this.festivalService.getFestivalBySlug(slug);
  }
}
