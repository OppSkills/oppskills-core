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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { TeamService } from './team.service';
import { CreateTeamDto } from '@oppskills/types';
import type { Request } from 'express';

@ApiTags('Teams')
@ApiBearerAuth('clerk-auth')
@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('create-team')
  @ApiOperation({ summary: 'Create a new team', description: 'Create a new team for a hackathon. The authenticated user becomes the team leader.' })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ status: 201, description: 'Team created successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input or team limit reached' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTeam(@Body() dto: CreateTeamDto, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.createTeam(dto, user.id);
  }

  @Get('teams/:hackathonId')
  @ApiOperation({ summary: 'Get teams by hackathon', description: 'Retrieve all teams for a specific hackathon' })
  @ApiParam({ name: 'hackathonId', description: 'Hackathon ID' })
  @ApiResponse({ status: 200, description: 'List of teams retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTeamsByHackathon(@Param('hackathonId') hackathonId: string) {
    return this.teamService.getTeamsByHackathon(hackathonId);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: 'Get team by ID', description: 'Retrieve detailed information about a specific team' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Team details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTeamById(@Param('teamId') teamId: string) {
    return this.teamService.getTeamById(teamId);
  }

  @Post('join-team')
  @ApiOperation({ summary: 'Join a team', description: 'Join an existing team using team ID or invitation code' })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({ status: 201, description: 'Successfully joined team' })
  @ApiResponse({ status: 400, description: 'Bad Request - Team full or already a member' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async joinTeam(@Body() dto: CreateTeamDto, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.joinTeam(dto, user.id);
  }

  @Delete('leave-team/:teamId')
  @ApiOperation({ summary: 'Leave a team', description: 'Leave a team you are currently a member of' })
  @ApiParam({ name: 'teamId', description: 'Team ID' })
  @ApiResponse({ status: 200, description: 'Successfully left team' })
  @ApiResponse({ status: 400, description: 'Bad Request - Not a team member or team leader cannot leave' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async leaveTeam(@Param('teamId') teamId: string, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.leaveTeam(teamId, user.id);
  }
}
