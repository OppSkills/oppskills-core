import {
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Query,
  Req,
} from '@nestjs/common';
import { CommunityStatsResponseDto } from './dto/community-stats-response.dto';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OptionalAuthService } from '../common/optional-auth.service';
import { CommunityService } from './community.service';
import { PublicCommunityListResponseDto } from './dto/public-community-list-item.dto';
import { PublicCommunityProfileDto } from './dto/public-community-profile.dto';

@ApiTags('Communities')
@Controller('communities/public')
export class CommunityPublicController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly optionalAuth: OptionalAuthService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'List public communities' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'industry', required: false, type: [String] })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, type: PublicCommunityListResponseDto })
  async listPublic(
    @Query('page') page?: number,
    @Query('take') take?: number,
    @Query('q') search?: string,
    @Query('industry', new ParseArrayPipe({ items: String, optional: true }))
    industry?: string[],
    @Query('sort') sort?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<PublicCommunityListResponseDto> {
    return this.communityService.listPublicCommunities({
      page,
      take,
      search,
      industry,
      sort,
      sortOrder,
    });
  }

  @Get(':handle')
  @ApiOperation({ summary: 'Get public community profile by handle' })
  @ApiResponse({ status: 200, type: PublicCommunityProfileDto })
  async getPublicProfile(
    @Param('handle') handle: string,
    @Req() req: Request,
  ): Promise<PublicCommunityProfileDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.communityService.getPublicProfileByHandle(
      handle,
      viewerUserId,
    );
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get community dashboard statistics',
    description:
      'Returns the statistics (members, page/post impressions, admin/moderator counts) for a community dashboard.',
  })
  @ApiResponse({
    status: 200,
    description: 'Community statistics retrieved successfully',
    type: CommunityStatsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getCommunityStats(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CommunityStatsResponseDto> {
    const userId = await this.optionalAuth.resolveUserId(req);
    return this.communityService.getCommunityStats(userId ?? '', id);
  }
}
