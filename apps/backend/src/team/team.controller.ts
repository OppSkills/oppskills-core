import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Req,
  UseGuards,
  Delete,
  Patch,
  UnauthorizedException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { TeamService } from './team.service';
import {
  CreateTeamDto,
  JoinTeamDto,
  RequestJoinTeamDto,
  RespondJoinRequestDto,
} from '@oppskills/types';
import type { Request } from 'express';

@ApiTags('Teams')
@ApiBearerAuth('clerk-auth')
@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post('create-team')
  @ApiOperation({
    summary: 'Create a new team',
    description:
      'Create a new team for a hackathon. The authenticated user becomes the team leader. Optionally include registration form answers.',
  })
  @ApiBody({ type: CreateTeamDto })
  @ApiResponse({
    status: 201,
    description: 'Team created successfully',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        name: { type: 'string', example: 'Code Warriors' },
        hackathonId: { type: 'string' },
        leaderId: { type: 'string' },
        maxSize: { type: 'number', example: 4 },
        invitationCode: { type: 'string', example: 'ABC123XY' },
        createdAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input or team limit reached',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async createTeam(@Body() dto: CreateTeamDto, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.createTeam(dto, user.id);
  }

  @Get('teams/:hackathonId')
  @ApiOperation({
    summary: 'Get teams by hackathon',
    description:
      'Retrieve all open teams for a specific hackathon that users can browse and join',
  })
  @ApiParam({
    name: 'hackathonId',
    description: 'Hackathon ID',
    type: 'string',
    example: 'cmjs132o7001yq901uh8byh06',
  })
  @ApiResponse({
    status: 200,
    description: 'List of teams retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          leaderId: { type: 'string' },
          maxSize: { type: 'number' },
          currentSize: { type: 'number' },
          invitationCode: { type: 'string' },
          members: { type: 'array', items: { type: 'object' } },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Hackathon not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getTeamsByHackathon(@Param('hackathonId') hackathonId: string) {
    return this.teamService.getTeamsByHackathon(hackathonId);
  }

  @Get('team/:teamId')
  @ApiOperation({
    summary: 'Get team by ID',
    description: 'Retrieve detailed information about a specific team',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Team details retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        hackathonId: { type: 'string', format: 'uuid' },
        leaderId: { type: 'string' },
        maxSize: { type: 'number' },
        invitationCode: { type: 'string' },
        members: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              userId: { type: 'string' },
              role: { type: 'string' },
              joinedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getTeamById(@Param('teamId') teamId: string) {
    return this.teamService.getTeamById(teamId);
  }

  @Get('my-team')
  @ApiOperation({
    summary: 'Check if user is in a team for a hackathon',
    description:
      'Returns the team if the user is already registered in a team for the specified hackathon, null otherwise.',
  })
  @ApiQuery({
    name: 'hackathonId',
    description: 'Hackathon ID',
    type: 'string',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Team check result',
    schema: {
      type: 'object',
      nullable: true,
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        leaderId: { type: 'string' },
        maxSize: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async checkMyTeam(
    @Query('hackathonId') hackathonId: string,
    @Req() req: Request,
  ) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.checkUserTeamInHackathon(hackathonId, user.id);
  }

  @Post('join-team')
  @ApiOperation({
    summary: 'Join a team',
    description:
      'Join an existing team using team ID or invitation code. Optionally include registration form answers.',
  })
  @ApiBody({ type: JoinTeamDto })
  @ApiResponse({
    status: 201,
    description: 'Successfully joined team',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully joined team' },
        teamId: { type: 'string', format: 'uuid' },
        memberId: { type: 'string', format: 'uuid' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Team full or already a member',
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async joinTeam(@Body() dto: JoinTeamDto, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.joinTeam(dto, user.id);
  }

  @Delete('leave-team/:teamId')
  @ApiOperation({
    summary: 'Leave a team',
    description: 'Leave a team you are currently a member of',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully left team',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully left team' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Not a team member or team leader cannot leave',
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async leaveTeam(@Param('teamId') teamId: string, @Req() req: Request) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.leaveTeam(teamId, user.id);
  }

  @Delete('leave-team/:teamId/member/:userId')
  @ApiOperation({
    summary: 'Remove a team member',
    description:
      'Remove a member from the team. Only team leader can perform this action. Cannot remove the leader.',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'string',
    format: 'uuid',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID of the member to remove',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Member removed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Member removed successfully' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot remove team leader',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only team leader can remove members',
  })
  @ApiResponse({ status: 404, description: 'Team or member not found' })
  async removeMember(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.removeMember(teamId, userId, user.id);
  }

  @Patch('team/:teamId/leader')
  @ApiOperation({
    summary: 'Change team leader',
    description:
      'Change the team leader. Only the original team creator can perform this action. New leader must be an existing team member.',
  })
  @ApiParam({
    name: 'teamId',
    description: 'Team ID',
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        newLeaderId: {
          type: 'string',
          description:
            'User ID of the new leader (must be an existing team member)',
          example: 'user_2abc123',
        },
      },
      required: ['newLeaderId'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Team leader changed successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Team leader changed successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - New leader must be an existing team member',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Only the original team creator can change the leader',
  })
  @ApiResponse({ status: 404, description: 'Team not found' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async changeTeamLeader(
    @Param('teamId') teamId: string,
    @Body() body: { newLeaderId: string },
    @Req() req: Request,
  ) {
    const user = req['user'];
    if (!user) {
      throw new UnauthorizedException('User not found in request');
    }
    return this.teamService.changeTeamLeader(teamId, body.newLeaderId, user.id);
  }

  @Post('request-join-team')
  @ApiOperation({
    summary: 'Request to join a team',
    description: 'Send a request to join an existing team',
  })
  @ApiBody({ type: RequestJoinTeamDto })
  @ApiResponse({ status: 201, description: 'Join request sent successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async requestJoinTeam(@Body() dto: RequestJoinTeamDto, @Req() req: Request) {
    const user = req['user'];
    if (!user) throw new UnauthorizedException('User not found in request');
    return this.teamService.requestJoinTeam(dto, user.id);
  }

  @Get('team/:teamId/requests')
  @ApiOperation({
    summary: 'Get join requests for a team',
    description:
      'Retrieve pending join requests for a team. Only team leader can view.',
  })
  @ApiParam({ name: 'teamId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Pending join requests retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Team not found' })
  async getTeamJoinRequests(
    @Param('teamId') teamId: string,
    @Req() req: Request,
  ) {
    const user = req['user'];
    if (!user) throw new UnauthorizedException('User not found in request');
    return this.teamService.getTeamJoinRequests(teamId, user.id);
  }

  @Post('team/requests/:requestId/respond')
  @ApiOperation({
    summary: 'Respond to a join request',
    description:
      'Accept or reject a team join request. Only team leader can respond.',
  })
  @ApiParam({ name: 'requestId', type: 'string', format: 'uuid' })
  @ApiBody({ type: RespondJoinRequestDto })
  @ApiResponse({ status: 200, description: 'Response processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Join request not found' })
  async respondToJoinRequest(
    @Param('requestId') requestId: string,
    @Body() dto: RespondJoinRequestDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    if (!user) throw new UnauthorizedException('User not found in request');
    return this.teamService.respondToJoinRequest(requestId, dto, user.id);
  }
}
