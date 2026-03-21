import {
  Controller,
  Post,
  Delete,
  Get,
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

  /**
   * Whether the current user already paid PER_USER entry fee for this hackathon
   * (can join another team without paying again).
   */
  @Get(':slug/teams/draft/per-user-fee-status')
  async getPerUserFeeStatus(
    @Param('slug') slug: string,
    @Req() req: { user: { id: string } },
  ) {
    const hasPaid = await this.draftTeamService.userHasPerUserEntryFeePaid(
      slug,
      req.user.id,
    );
    return { hasPaid };
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
