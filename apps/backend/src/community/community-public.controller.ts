import {
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { OptionalAuthService } from '../common/optional-auth.service';
import { CommunityService } from './community.service';
import { PublicCommunityListItemDto, PublicCommunityListResponseDto } from './dto/public-community-list-item.dto';
import { PublicCommunityProfileDto } from './dto/public-community-profile.dto';
import { PublicCommunityMembersResponseDto } from './dto/public-community-member.dto';

@ApiTags('Communities')
@Controller('communities/public')
export class CommunityPublicController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly optionalAuth: OptionalAuthService,
  ) {}

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

  @Get('trending')
  @ApiOperation({ summary: 'List trending public communities' })
  @ApiResponse({ status: 200, type: [PublicCommunityListItemDto] })
  async listTrending(
    @Req() req: Request,
    @Query('limit') limit?: number,
  ): Promise<PublicCommunityListItemDto[]> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.communityService.listTrendingCommunities(
      limit ? Number(limit) : 4,
      viewerUserId,
    );
  }

  @Get(':handle')
  @ApiOperation({ summary: 'Get public community profile by handle' })
  @ApiResponse({ status: 200, type: PublicCommunityProfileDto })
  async getPublicProfile(
    @Param('handle') handle: string,
    @Req() req: Request,
  ): Promise<PublicCommunityProfileDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    return this.communityService.getPublicProfileByHandle(handle, viewerUserId);
  }

  @Get(':handle/members')
  @ApiOperation({ summary: 'List public community members' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, type: PublicCommunityMembersResponseDto })
  async listPublicMembers(
    @Param('handle') handle: string,
    @Query('page') page?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
  ): Promise<PublicCommunityMembersResponseDto> {
    return this.communityService.listPublicMembers(handle, {
      page: page ? Number(page) : undefined,
      take: take ? Number(take) : undefined,
      search,
    });
  }
}
