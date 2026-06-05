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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { CommunityService } from './community.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { CommunityResponseDto } from './dto/community-response.dto';
import { CommunityListItemDto } from './dto/community-list-item.dto';
import { AddCommunityMembersDto } from './dto/add-community-members.dto';
import { UpdateMemberTypeDto } from './dto/update-member-type.dto';
import { UpdateMemberAccessDto } from './dto/update-member-access.dto';
import { CommunityStatsResponseDto } from './dto/community-stats-response.dto';

@ApiTags('Communities')
@ApiBearerAuth('clerk-auth')
@Controller('communities')
@UseGuards(ClerkAuthGuard)
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('my')
  @ApiOperation({
    summary: 'List my communities',
    description:
      'Returns communities you own or where you are an admin or editor member.',
  })
  @ApiResponse({ status: 200, type: [CommunityListItemDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listMine(
    @Req() req: Request,
  ): Promise<{ items: CommunityListItemDto[] }> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    const items = await this.communityService.listMyCommunities(userId);
    return { items };
  }

  @Get(':id')
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

  @Post(':id/members')
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

  @Patch(':id/members/:memberId/type')
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
  @ApiOperation({
    summary: 'Get current user member record in a community',
  })
  @ApiResponse({ status: 200, description: 'Member record' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  async getMyMemberRecord(
    @Param('id') communityId: string,
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.getMemberRecord(userId, communityId);
  }

  @Get(':id/members')
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
    @Req() req: Request,
  ) {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.communityService.listMembers(userId, communityId, {
      page: page ? Number(page) : undefined,
      take: take ? Number(take) : undefined,
      search,
      role,
      sortDirection,
    });
  }

  @Delete(':id/members/:memberId')
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
}
