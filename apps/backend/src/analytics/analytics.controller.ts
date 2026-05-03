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
}
