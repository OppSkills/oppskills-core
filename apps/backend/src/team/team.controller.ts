import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
  Delete,
  UnauthorizedException,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { TeamService } from './team.service';
import { CreateTeamDto } from '@oppskills/types';
import type { Request } from 'express';

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('create-team')
  async createTeam(@Body() dto: CreateTeamDto, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.createTeam(dto, user.id);
  }

  @Get('teams/:hackathonId')
  async getTeamsByHackathon(@Param('hackathonId') hackathonId: string) {
    return this.teamService.getTeamsByHackathon(hackathonId);
  }

  @Get('team/:teamId')
  async getTeamById(@Param('teamId') teamId: string) {
    return this.teamService.getTeamById(teamId);
  }

  @Post('join-team')
  async joinTeam(@Body() dto: CreateTeamDto, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.joinTeam(dto, user.id);
  }

  @Delete('leave-team/:teamId')
  async leaveTeam(@Param('teamId') teamId: string, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.leaveTeam(teamId, user.id);
  }
}
