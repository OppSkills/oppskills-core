import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('event/:slug/general')
    async getEventGeneralStats(@Param('slug') slug: string) {
        const stats = await this.analyticsService.getEventGeneralStats(slug);
        if (!stats) throw new NotFoundException('Event not found');
        return stats;
    }

    @Get('hackathon/:slug/general')
    async getHackathonGeneralStats(@Param('slug') slug: string) {
        const stats = await this.analyticsService.getHackathonGeneralStats(slug);
        if (!stats) throw new NotFoundException('Hackathon not found');
        return stats;
    }
}
