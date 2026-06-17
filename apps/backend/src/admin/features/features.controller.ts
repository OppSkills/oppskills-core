import {
  Controller,
  Get,
  Put,
  Query,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AdminFeaturesService } from './features.service';
import { AdminGuard } from '../admin.guard';
import { ApprovalStatus } from '@prisma/client';

@Controller('admin/features')
@UseGuards(AdminGuard)
export class AdminFeaturesController {
  constructor(private readonly featuresService: AdminFeaturesService) {}

  @Get('hackathons')
  async listHackathons(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
    @Query('filterPending') filterPending?: string,
  ) {
    return this.featuresService.listHackathons(
      limit,
      cursor,
      filterPending === 'true',
    );
  }

  @Get('events')
  async listEvents(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
    @Query('filterPending') filterPending?: string,
  ) {
    return this.featuresService.listEvents(
      limit,
      cursor,
      filterPending === 'true',
    );
  }

  @Get('festivals')
  async listFestivals(
    @Query('limit', ParseIntPipe) limit: number,
    @Query('cursor') cursor?: string,
    @Query('filterPending') filterPending?: string,
  ) {
    return this.featuresService.listFestivals(
      limit,
      cursor,
      filterPending === 'true',
    );
  }

  @Get('detail/:type/:slug')
  async getDetail(
    @Param('type') type: 'hackathon' | 'event' | 'festival',
    @Param('slug') slug: string,
  ) {
    return this.featuresService.getDetailBySlug(type, slug);
  }

  @Put('detail/:type/:id')
  async updateDetail(
    @Param('type') type: 'hackathon' | 'event' | 'festival',
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.featuresService.updateDetail(type, id, data);
  }

  @Put('approval/:type/:id')
  async toggleApproval(
    @Param('type') type: 'hackathon' | 'event' | 'festival',
    @Param('id') id: string,
    @Body('status') status: ApprovalStatus,
  ) {
    return this.featuresService.toggleApproval(type, id, status);
  }
}
