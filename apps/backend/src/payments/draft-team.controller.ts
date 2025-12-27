import {
  Controller,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClerkAuthGuard } from 'src/common/clerk-auth.guard';
import { DraftTeamService } from './draft-team.service';
import { CreateDraftTeamDto, JoinDraftTeamDto, LeaveDraftTeamDto } from './dto';

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class DraftTeamController {
  constructor(private readonly draftTeamService: DraftTeamService) {}

  @Post(':slug/teams/draft')
  async createDraftTeam(
    @Param('slug') slug: string,
    @Body() body: CreateDraftTeamDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.draftTeamService.createDraftTeam({
      hackathonSlug: slug,
      leaderId: req.user.id,
      name: body.name,
      maxSize: body.maxSize,
    });
  }

  @Post(':slug/teams/draft/join')
  async joinDraftTeam(
    @Body() body: JoinDraftTeamDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.draftTeamService.joinDraftTeam({
      userId: req.user.id,
      teamId: body.teamId,
      invitationCode: body.invitationCode,
    });
  }

  @Delete(':slug/teams/draft/leave')
  async leaveDraftTeam(
    @Body() body: LeaveDraftTeamDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.draftTeamService.leaveDraftTeam({
      userId: req.user.id,
      teamId: body.teamId,
    });
  }
}
