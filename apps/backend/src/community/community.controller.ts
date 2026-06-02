import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
}
