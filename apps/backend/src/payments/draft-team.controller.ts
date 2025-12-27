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

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class DraftTeamController {
  constructor(private readonly draftTeamService: DraftTeamService) {}

  @Post(':slug/teams/draft')
  async createDraftTeam(
    @Param('slug') slug: string,
    @Body() body: { name: string; maxSize?: number },
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
    @Body() body: { teamId?: string; invitationCode?: string },
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
    @Body() body: { teamId: string },
    @Req() req: { user: { id: string } },
  ) {
    return this.draftTeamService.leaveDraftTeam({
      userId: req.user.id,
      teamId: body.teamId,
    });
  }
}
