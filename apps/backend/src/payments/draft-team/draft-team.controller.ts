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
import { ReferralService } from '../referral/referral.service';
import { ReferralEntityTypeDto } from '@oppskills/types';
import { prisma } from '@oppskills/db';

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class DraftTeamController {
  constructor(
    private readonly draftTeamService: DraftTeamService,
    private readonly referralService: ReferralService,
  ) {}

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
    @Param('slug') slug: string,
    @Body() body: JoinDraftTeamDto,
    @Req() req: { user: { id: string } },
  ) {
    // Best-effort referral resolution — never blocks the join if the code is
    // invalid / mismatched; passes a nullable referralId down to the service.
    let referralId: string | null = null;
    if (body.referralCode) {
      try {
        const hackathon = await prisma.hackathonEntity.findUnique({
          where: { slug, isDeleted: false },
          select: { id: true, festivalId: true },
        });
        if (hackathon) {
          referralId = await this.referralService.resolveForRegistration({
            code: body.referralCode,
            userId: req.user.id,
            expectedEntityType: ReferralEntityTypeDto.HACKATHON,
            expectedEntityId: hackathon.id,
            parentFestivalId: hackathon.festivalId,
          });
        }
      } catch {
        referralId = null;
      }
    }

    return this.draftTeamService.joinDraftTeam({
      userId: req.user.id,
      teamId: body.teamId,
      invitationCode: body.invitationCode,
      referralId,
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
