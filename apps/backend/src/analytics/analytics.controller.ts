import {
  Controller,
  Get,
  Param,
  NotFoundException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(ClerkAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('event/:slug/general')
  async getEventGeneralStats(@Param('slug') slug: string, @Req() req: any) {
    const userId = req.user?.id;
    const stats = await this.analyticsService.getEventGeneralStats(
      slug,
      userId,
    );
    if (!stats) throw new NotFoundException('Event not found');
    return stats;
  }

  @Get('event/:slug/detailed')
  async getEventDetailedStats(@Param('slug') slug: string, @Req() req: any) {
    const userId = req.user?.id;
    const stats = await this.analyticsService.getEventDetailedStats(
      slug,
      userId,
    );
    if (!stats) throw new NotFoundException('Event not found');
    return stats;
  }

  @Get('hackathon/:slug/general')
  async getHackathonGeneralStats(@Param('slug') slug: string, @Req() req: any) {
    const userId = req.user?.id;
    const stats = await this.analyticsService.getHackathonGeneralStats(
      slug,
      userId,
    );
    if (!stats) throw new NotFoundException('Hackathon not found');
    return stats;
  }

  @Get('hackathon/:slug/detailed')
  async getHackathonDetailedStats(
    @Param('slug') slug: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    const stats = await this.analyticsService.getHackathonDetailedStats(
      slug,
      userId,
    );
    if (!stats) throw new NotFoundException('Hackathon not found');
    return stats;
  }

  @Get('organizer-stats')
  async getOrganizerStats(@Req() req: any) {
    const userId = req.user?.id;
    // userId is guaranteed by ClerkAuthGuard but let's be safe
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerStats(userId);
  }

  @Get('organizer-trends')
  async getOrganizerRegistrationTrends(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerRegistrationTrends(userId);
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
  async getOrganizerRegistrationsSummary(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerRegistrationsSummary(userId);
  }

  @Get('organizer/opportunities-summary')
  async getOrganizerOpportunitiesSummary(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerOpportunitiesSummary(userId);
  }

  @Get('organizer/payments-summary')
  async getOrganizerPaymentsSummary(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerPaymentsSummary(userId);
  }

  @Get('organizer/roles-summary')
  async getOrganizerRolesSummary(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerRolesSummary(userId);
  }

  @Get('organizer/notifications-summary')
  async getOrganizerNotificationsSummary(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerNotificationsSummary(userId);
  }

  @Get('organizer/referrals-summary')
  async getOrganizerReferralsSummary(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerReferralsSummary(userId);
  }

  @Get('organizer/pipeline-summary')
  async getOrganizerPipelineSummary(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerPipelineSummary(userId);
  }

  @Get('organizer/settings-summary')
  async getOrganizerSettingsSummary(@Req() req: any) {
    const userId = req.user?.id;
    if (!userId) throw new NotFoundException('User not found');
    return this.analyticsService.getOrganizerSettingsSummary(userId);
  }
}
