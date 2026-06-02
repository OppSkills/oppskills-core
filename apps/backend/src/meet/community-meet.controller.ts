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
import { CreateCommunityMeetDto } from './dto/create-community-meet.dto';
import { CommunityMeetResponseDto } from './dto/community-meet-response.dto';
import { MeetService } from './meet.service';

@ApiTags('Community Meets')
@ApiBearerAuth('clerk-auth')
@Controller('communities/:communityId/meets')
@UseGuards(ClerkAuthGuard)
export class CommunityMeetController {
  constructor(private readonly meetService: MeetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a community meet' })
  @ApiBody({ type: CreateCommunityMeetDto })
  @ApiResponse({ status: 201, type: CommunityMeetResponseDto })
  async createMeet(
    @Param('communityId') communityId: string,
    @Body() dto: CreateCommunityMeetDto,
    @Req() req: Request,
  ): Promise<CommunityMeetResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.meetService.createMeet(userId, communityId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List community meets' })
  @ApiResponse({ status: 200, type: [CommunityMeetResponseDto] })
  async listMeets(
    @Param('communityId') communityId: string,
    @Req() req: Request,
  ): Promise<{ items: CommunityMeetResponseDto[] }> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    const items = await this.meetService.listMeets(userId, communityId);
    return { items };
  }
}
