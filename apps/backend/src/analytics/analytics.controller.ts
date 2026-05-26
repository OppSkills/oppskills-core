import {
  Controller,
  Get,
  Param,
  NotFoundException,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { AnalyticsService } from './analytics.service';
import type {
  OrganizerRegistrationsSummaryDto,
  OrganizerOpportunitiesSummaryDto,
  OrganizerPaymentsSummaryDto,
  OrganizerRolesSummaryDto,
  OrganizerNotificationsSummaryDto,
  OrganizerReferralsSummaryDto,
  OrganizerPipelineSummaryDto,
  OrganizerSettingsSummaryDto,
} from '@oppskills/types';

@Controller('analytics')
@UseGuards(ClerkAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('event/:slug/general')
  async getEventGeneralStats(
    @Param('slug') slug: string,
    @Query('period') period: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const stats = await this.analyticsService.getEventGeneralStats(
      slug,
      userId,
      { period, from, to },
    );
    if (!stats) throw new NotFoundException('Event not found');
    return stats;
  }

  @Get('event/:slug/detailed')
  async getEventDetailedStats(
    @Param('slug') slug: string,
    @Query('period') period: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const stats = await this.analyticsService.getEventDetailedStats(
      slug,
      userId,
      { period, from, to },
    );
    if (!stats) throw new NotFoundException('Event not found');
    return stats;
  }

  @Get('hackathon/:slug/general')
  async getHackathonGeneralStats(
    @Param('slug') slug: string,
    @Query('period') period: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const stats = await this.analyticsService.getHackathonGeneralStats(
      slug,
      userId,
      { period, from, to },
    );
    if (!stats) throw new NotFoundException('Hackathon not found');
    return stats;
  }

  @Get('hackathon/:slug/detailed')
  async getHackathonDetailedStats(
    @Param('slug') slug: string,
    @Query('period') period: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const stats = await this.analyticsService.getHackathonDetailedStats(
      slug,
      userId,
      { period, from, to },
    );
    if (!stats) throw new NotFoundException('Hackathon not found');
    return stats;
  }

  @Get('organizer-stats')
  async getOrganizerStats(
    @Query('period') period: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    // userId is guaranteed by ClerkAuthGuard but let's be safe
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerStats(userId, {
      period,
      from,
      to,
    });
  }

  @Get('organizer-trends')
  async getOrganizerRegistrationTrends(
    @Query('period') period: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerRegistrationTrends(userId, {
      period,
      from,
      to,
    });
  }

  @Get('organizer-top-listings')
  async getTopListings(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getTopListings(userId);
  }

  @Get('organizer-highest-performing')
  async getHighestPerformingListings(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getHighestPerformingListings(userId);
  }

  @Get('organizer/registrations-summary')
  async getRegistrationsSummary(
    @Req() req: any,
  ): Promise<OrganizerRegistrationsSummaryDto> {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getRegistrationsSummary(userId);
  }

  @Get('organizer/opportunities-summary')
  async getOpportunitiesSummary(
    @Req() req: any,
  ): Promise<OrganizerOpportunitiesSummaryDto> {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOpportunitiesSummary(userId);
  }

  @Get('organizer/payments-summary')
  async getPaymentsSummary(
    @Req() req: any,
  ): Promise<OrganizerPaymentsSummaryDto> {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getPaymentsSummary(userId);
  }

  @Get('organizer/roles-summary')
  async getRolesSummary(@Req() req: any): Promise<OrganizerRolesSummaryDto> {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getRolesSummary(userId);
  }

  @Get('organizer/notifications-summary')
  async getNotificationsSummary(
    @Req() req: any,
  ): Promise<OrganizerNotificationsSummaryDto> {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getNotificationsSummary(userId);
  }

  @Get('organizer/referrals-summary')
  async getReferralsSummary(
    @Req() req: any,
  ): Promise<OrganizerReferralsSummaryDto> {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getReferralsSummary(userId);
  }

  @Get('organizer/pipeline-summary')
  async getPipelineSummary(
    @Req() req: any,
  ): Promise<OrganizerPipelineSummaryDto> {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getPipelineSummary(userId);
  }

  @Get('organizer/settings-summary')
  async getSettingsSummary(
    @Req() req: any,
  ): Promise<OrganizerSettingsSummaryDto> {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getSettingsSummary(userId);
  }
}
