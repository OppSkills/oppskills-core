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
import { MeetJoinTokenResponseDto } from './dto/meet-join-token-response.dto';
import { MeetPreviewResponseDto } from './dto/meet-preview-response.dto';
import { MeetService } from './meet.service';

@ApiTags('Meets')
@ApiBearerAuth('clerk-auth')
@Controller('meets')
@UseGuards(ClerkAuthGuard)
export class MeetController {
  constructor(private readonly meetService: MeetService) {}

  @Get('my')
  @ApiOperation({ summary: 'List meets hosted by the current user' })
  @ApiResponse({ status: 200, type: [CommunityMeetResponseDto] })
  async listHostedMeets(
    @Req() req: Request,
  ): Promise<{ items: CommunityMeetResponseDto[] }> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    const items = await this.meetService.listHostedMeets(userId);
    return { items };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a personal meet' })
  @ApiBody({ type: CreateCommunityMeetDto })
  @ApiResponse({ status: 201, type: CommunityMeetResponseDto })
  async createPersonalMeet(
    @Body() dto: CreateCommunityMeetDto,
    @Req() req: Request,
  ): Promise<CommunityMeetResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.meetService.createPersonalMeet(userId, dto);
  }

  @Get(':inviteCode')
  @ApiOperation({ summary: 'Get meet preview for lobby' })
  @ApiResponse({ status: 200, type: MeetPreviewResponseDto })
  async getMeetPreview(
    @Param('inviteCode') inviteCode: string,
    @Req() req: Request,
  ): Promise<MeetPreviewResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.meetService.getMeetPreview(userId, inviteCode);
  }

  @Post(':inviteCode/token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue LiveKit join token' })
  @ApiResponse({ status: 200, type: MeetJoinTokenResponseDto })
  async createJoinToken(
    @Param('inviteCode') inviteCode: string,
    @Req() req: Request,
  ): Promise<MeetJoinTokenResponseDto> {
    const userId = req.user?.id;
    if (typeof userId !== 'string' || userId.trim().length === 0) {
      throw new UnauthorizedException('User not found.');
    }
    return this.meetService.createJoinToken(userId, inviteCode);
  }
}
