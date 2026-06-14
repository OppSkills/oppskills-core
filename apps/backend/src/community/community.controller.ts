import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import {
  CommunityResponseDto,
  PostableCommunityDto,
} from './dto/community-response.dto';
import { CommunityListItemDto } from './dto/community-list-item.dto';
import { AddCommunityMembersDto } from './dto/add-community-members.dto';
import { CreateMemberTypeDto } from './dto/create-member-type.dto';
import { UpdateMemberTypeDto } from './dto/update-member-type.dto';
import { UpdateMemberAccessDto } from './dto/update-member-access.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import {
  CheckCommunityHandleResponseDto,
  SuggestCommunityHandlesResponseDto,
} from './dto/check-community-handle.dto';
import { CommunityStatsResponseDto } from './dto/community-stats-response.dto';
import { CommunityPostService } from './post/community-post.service';
import { OptionalAuthService } from '../common/optional-auth.service';
import { CommunityPostFeedQueryDto } from './post/dto/community-post-feed-query.dto';
import { CommunityPostFeedResponseDto } from './post/dto/community-post-response.dto';

@ApiTags('Communities')
@Controller('communities')
export class CommunityController {
  constructor(
    private readonly communityService: CommunityService,
    private readonly postService: CommunityPostService,
    private readonly optionalAuth: OptionalAuthService,
  ) {}

  @Get('my')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'List my communities',
    description:
      'Returns communities you own or where you are an admin or editor member.',
  })
  @ApiResponse({ status: 200, type: [CommunityListItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listMine(
    @Req() req: Request,
    @Query('includeFollowed') includeFollowed?: string,
  ): Promise<{ items: CommunityListItemDto[] }> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    const withFollowed = includeFollowed === 'true';
    const items = await this.communityService.listMyCommunities(
      userId,
      withFollowed,
    );
    return { items };
  }

  @Get('postable')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'List postable communities',
    description:
      'Returns communities where the authenticated user can create posts.',
  })
  @ApiResponse({ status: 200, type: [PostableCommunityDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listPostable(@Req() req: Request): Promise<PostableCommunityDto[]> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.listPostableCommunities(userId);
  }

  @Get('handles/check')
  @ApiOperation({
    summary: 'Check if a community handle is available',
    description:
      'Returns whether the given handle is free to register. Public — no auth required.',
  })
  @ApiResponse({ status: 200, type: CheckCommunityHandleResponseDto })
  async checkHandleAvailability(
    @Query('handle') handle: string,
  ): Promise<CheckCommunityHandleResponseDto> {
    const available = await this.communityService.isHandleAvailable(
      handle ?? '',
    );
    return { available };
  }

  @Get('handles/suggest')
  @ApiOperation({
    summary: 'Suggest available community handles from a display name',
    description:
      'Generates handle candidates from the community name and returns those not yet taken.',
  })
  @ApiResponse({ status: 200, type: SuggestCommunityHandlesResponseDto })
  async suggestHandles(
    @Query('name') name: string,
  ): Promise<SuggestCommunityHandlesResponseDto> {
    const suggestions = await this.communityService.suggestHandles(name ?? '');
    return { suggestions };
  }

  @Get('public-posts')
  @ApiOperation({ summary: 'List mixed/global public community feed posts' })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({ status: 200, type: CommunityPostFeedResponseDto })
  async listGlobalFeed(
    @Query() query: CommunityPostFeedQueryDto,
    @Req() req: Request,
  ): Promise<CommunityPostFeedResponseDto> {
    const viewerUserId = await this.optionalAuth.resolveUserId(req);
    const parsedTake = query.take
      ? Math.min(100, Math.max(1, parseInt(query.take as any, 10) || 20))
      : 20;
    return this.postService.listGlobalPublicFeed(
      query.cursor,
      parsedTake,
      viewerUserId,
    );
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Get community details by ID',
    description:
      'Returns the full details of a community if the user is authorized to manage it.',
  })
  @ApiResponse({
    status: 200,
    description: 'Community details retrieved successfully',
    type: CommunityResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getCommunityById(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CommunityResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.getCommunityById(userId, id);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a community',
    description:
      'Creates a new community owned by the authenticated user. Cover and avatar images should be uploaded via the media presign endpoints first.',
  })
  @ApiBody({ type: CreateCommunityDto })
  @ApiResponse({
    status: 201,
    description: 'Community created successfully',
    type: CommunityResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Handle or name already taken',
  })
  async create(
    @Body() dto: CreateCommunityDto,
    @Req() req: Request,
  ): Promise<CommunityResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }

    return this.communityService.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Update community profile',
    description:
      'Updates community details such as cover, avatar, description. Requires write permission.',
  })
  @ApiBody({ type: UpdateCommunityDto })
  @ApiResponse({
    status: 200,
    description: 'Community updated successfully',
    type: CommunityResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommunityDto,
    @Req() req: Request,
  ): Promise<CommunityResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.updateCommunity(userId, id, dto);
  }

  @Post(':id/follow')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a community (join as member)' })
  @ApiResponse({ status: 200, description: 'Now following the community' })
  async followCommunity(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.followCommunity(userId, id);
  }

  @Delete(':id/follow')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a community (leave membership)' })
  @ApiResponse({
    status: 200,
    description: 'No longer following the community',
  })
  async unfollowCommunity(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.unfollowCommunity(userId, id);
  }

  @Post(':id/members')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk add members to a community',
    description:
      'Adds multiple users to a community by their user IDs with a specific role and access control level.',
  })
  @ApiBody({ type: AddCommunityMembersDto })
  @ApiResponse({ status: 201, description: 'Members added successfully' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation or self-addition error',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No permission to manage community',
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found - User ID or Community not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User is already a member',
  })
  async addMembers(
    @Param('id') communityId: string,
    @Body() dto: AddCommunityMembersDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.addMembersToCommunity(
      userId,
      communityId,
      dto,
    );
  }

  @Get(':id/members/types')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Fetch unique member types (roles) for a community',
    description:
      'Retrieves all distinct member types/roles currently assigned to members in the community.',
  })
  @ApiResponse({
    status: 200,
    description: 'Unique member types list',
    type: [String],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getUniqueMemberTypes(
    @Param('id') communityId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.getUniqueMemberTypes(userId, communityId);
  }

  @Post(':id/members/types')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Create a member type label for a community',
    description:
      'Persists a custom member type tab label. Types appear even before members are assigned.',
  })
  @ApiBody({ type: CreateMemberTypeDto })
  @ApiResponse({
    status: 201,
    description: 'Member type created; returns updated type list',
    type: [String],
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createMemberType(
    @Param('id') communityId: string,
    @Body() dto: CreateMemberTypeDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.createMemberType(
      userId,
      communityId,
      dto.role,
    );
  }

  @Delete(':id/members/types')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Delete a stored member type label',
    description:
      'Removes a custom member type tab. Fails if members are still assigned to that type.',
  })
  @ApiBody({ type: CreateMemberTypeDto })
  @ApiResponse({
    status: 200,
    description: 'Member type deleted; returns updated type list',
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async deleteMemberType(
    @Param('id') communityId: string,
    @Body() dto: CreateMemberTypeDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.deleteMemberType(
      userId,
      communityId,
      dto.role,
    );
  }

  @Patch(':id/members/:memberId/type')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: "Update a member's type (role string)",
    description:
      'Updates the role description string for a specific member in the community.',
  })
  @ApiBody({ type: UpdateMemberTypeDto })
  @ApiResponse({ status: 200, description: 'Type updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async updateMemberType(
    @Param('id') communityId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberTypeDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.updateMemberType(
      userId,
      communityId,
      memberId,
      dto.role,
    );
  }

  @Patch(':id/members/:memberId/access-control')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: "Update a member's access control role",
    description:
      'Updates the access control level for a specific member in the community.',
  })
  @ApiBody({ type: UpdateMemberAccessDto })
  @ApiResponse({
    status: 200,
    description: 'Access control updated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async updateMemberAccess(
    @Param('id') communityId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberAccessDto,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.updateMemberAccess(
      userId,
      communityId,
      memberId,
      dto.accessControlRole,
    );
  }

  @Get(':id/members/me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Get current user member record in a community',
  })
  @ApiResponse({ status: 200, description: 'Member record' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden – regular members cannot access the dashboard',
  })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getMyMemberRecord(
    @Param('id') communityId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    const record = await this.communityService.getMemberRecord(
      userId,
      communityId,
    );
    // Dashboard eligibility: only ADMIN, MODERATOR, READ_ONLY (and the owner)
    // may access the manage dashboard. Regular MEMBERs are community
    // participants only and must not gain dashboard access.
    const eligibleRoles = ['ADMIN', 'MODERATOR', 'READ_ONLY'];
    if (!eligibleRoles.includes(record.accessControlRole)) {
      throw new ForbiddenException(
        'You do not have permission to view this community dashboard.',
      );
    }
    return record;
  }

  @Get(':id/members')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'List community members',
    description: 'Retrieves all members of the community.',
  })
  @ApiResponse({ status: 200, description: 'Members list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async listMembers(
    @Param('id') communityId: string,
    @Query('page') page?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('sortDirection') sortDirection?: 'asc' | 'desc',
    @Req() req?: Request,
  ) {
    const userId = req?.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    const parsedPage = page ? Math.max(1, parseInt(page, 10) || 1) : undefined;
    const parsedTake = take ? Math.max(1, parseInt(take, 10) || 20) : undefined;
    return this.communityService.listMembers(userId, communityId, {
      page: parsedPage,
      take: parsedTake,
      search,
      role,
      sortDirection,
    });
  }

  @Delete(':id/members/:memberId')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Delete a community member',
    description: 'Removes a member from the community.',
  })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async deleteMember(
    @Param('id') communityId: string,
    @Param('memberId') memberId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.deleteMember(userId, communityId, memberId);
  }

  @Get(':id/stats')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
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
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.getCommunityStats(userId, id);
  }

  @Post(':id/join')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Join a community',
    description:
      'Allows an authenticated user to join a community as a MEMBER, optionally attributing a referral code.',
  })
  @ApiResponse({ status: 200, description: 'Successfully joined community' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  async joinCommunity(
    @Param('id') communityId: string,
    @Body('referralCode') referralCode: string | undefined,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.joinCommunity(
      userId,
      communityId,
      referralCode,
    );
  }
}
