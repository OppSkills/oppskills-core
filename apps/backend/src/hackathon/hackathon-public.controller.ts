import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { HackathonService } from './hackathon.service';

function assertNonEmptyId(id: string, fieldName: string): string {
  const trimmed = id.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
  return trimmed;
}

/**
 * Public hackathon endpoints (no authentication required).
 * Returns sanitized data without PII.
 */
@ApiTags('Hackathons (Public)')
@Controller('hackathons/public')
export class HackathonPublicController {
  constructor(private readonly hackathonService: HackathonService) {}

  /**
   * GET /hackathons/public - List public hackathons (PUBLISHED/ONGOING + APPROVED only).
   * Returns sanitized data without teams or participant PII.
   */
  @Get()
  @ApiOperation({
    summary: 'List public hackathons (PUBLISHED/ONGOING + APPROVED only)',
  })
  @ApiQuery({
    name: 'festival_id',
    required: false,
    description: 'Filter hackathons by festival ID',
  })
  @ApiResponse({
    status: 200,
    description: 'List of public hackathons (sanitized)',
  })
  async listPublicHackathons(@Query('festival_id') festivalId?: string) {
    return this.hackathonService.listPublicHackathons({ festivalId });
  }

  /**
   * GET /hackathons/public/by-slug/:slug - Get public hackathon by slug.
   * Returns sanitized data without teams, participants, or PII.
   */
  @Get('by-slug/:slug')
  @ApiOperation({ summary: 'Get public hackathon by slug (sanitized, no PII)' })
  @ApiParam({ name: 'slug', description: 'Hackathon slug' })
  @ApiResponse({
    status: 200,
    description: 'Public hackathon details (sanitized)',
  })
  @ApiResponse({
    status: 404,
    description: 'Hackathon not found or not publicly visible',
  })
  async getPublicHackathonBySlug(@Param('slug') slug: string) {
    const validSlug = assertNonEmptyId(slug, 'slug');
    return this.hackathonService.getPublicHackathonBySlug(validSlug);
  }

  /**
   * GET /hackathons/public/:id - Get public hackathon by ID.
   * Returns sanitized data without teams, participants, or PII.
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get public hackathon by ID (sanitized, no PII)' })
  @ApiParam({ name: 'id', description: 'Hackathon ID' })
  @ApiResponse({
    status: 200,
    description: 'Public hackathon details (sanitized)',
  })
  @ApiResponse({
    status: 404,
    description: 'Hackathon not found or not publicly visible',
  })
  async getPublicHackathon(@Param('id') id: string) {
    const validId = assertNonEmptyId(id, 'id');
    return this.hackathonService.getPublicHackathonById(validId);
  }
}
