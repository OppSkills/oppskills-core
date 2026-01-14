import { Controller, Get, Param, NotFoundException, UseGuards, Req } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(ClerkAuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('event/:slug/general')
    async getEventGeneralStats(
        @Param('slug') slug: string,
        @Req() req: any,
    ) {
        const userId = req.user?.id;
        const stats = await this.analyticsService.getEventGeneralStats(slug, userId);
        if (!stats) throw new NotFoundException('Event not found');
        return stats;
    }

    @Get('hackathon/:slug/general')
    async getHackathonGeneralStats(
        @Param('slug') slug: string,
        @Req() req: any,
    ) {
        const userId = req.user?.id;
        const stats = await this.analyticsService.getHackathonGeneralStats(slug, userId);
        if (!stats) throw new NotFoundException('Hackathon not found');
        return stats;
    }
}
