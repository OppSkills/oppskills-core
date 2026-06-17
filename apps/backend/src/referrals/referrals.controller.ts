import { Controller, Get, Post, Body, Param, UseGuards, Req, Delete, Query } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { GenerateReferralDto, TrackClickDto, ReferralEntityTypeDto } from '@oppskills/types';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('public/resolve/:code')
  @ApiOperation({ summary: 'Resolve a referral code to get entity and referrer info' })
  async resolveCode(@Param('code') code: string) {
    return this.referralsService.resolveCode(code);
  }

  @Post('public/track-click')
  @ApiOperation({ summary: 'Track a click on a referral code' })
  async trackClick(@Body() dto: TrackClickDto) {
    return this.referralsService.trackClick(dto);
  }

  @Post()
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new referral link' })
  async generateReferral(@Body() dto: GenerateReferralDto) {
    return this.referralsService.generateReferral(dto);
  }

  @Get('my/performance')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get performance metrics for my referrals' })
  async getMyPerformance(@Req() req: any) {
    // We assume ClerkAuthGuard attaches the internal user entity to req.userEntity
    const userId = req.userEntity.id;
    return this.referralsService.getMyPerformance(userId);
  }

  @Get('my/referred-users')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get users who registered using my referrals' })
  async getMyReferredUsers(@Req() req: any) {
    const userId = req.userEntity.id;
    return this.referralsService.getMyReferredUsers(userId);
  }

  @Get('entity/:type/:id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all referrals for a specific entity' })
  async getReferralsByEntity(
    @Param('type') type: ReferralEntityTypeDto,
    @Param('id') id: string
  ) {
    return this.referralsService.getReferralsByEntity(type, id);
  }
  @Get('analytics')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get listing analytics for an entity' })
  async getAnalytics(
    @Query('entityType') entityType: ReferralEntityTypeDto,
    @Query('entityId') entityId: string
  ) {
    return this.referralsService.getAnalytics(entityType, entityId);
  }

  @Get('user-lookup')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Look up a user by email for referral' })
  async lookupUser(
    @Query('email') email: string,
    @Query('entityType') entityType: ReferralEntityTypeDto,
    @Query('entityId') entityId: string
  ) {
    return this.referralsService.lookupUser(email, entityType, entityId);
  }

  @Get(':id/referrer-details')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed performance data for a referral' })
  async getReferrerDetails(@Param('id') id: string) {
    return this.referralsService.getReferrerDetails(id);
  }

  @Get(':id/registrations')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List attributed registrations for a referral' })
  async getRegistrations(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ) {
    return this.referralsService.getRegistrations(id, page, pageSize);
  }

  @Get(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get basic details for a single referral' })
  async getReferralDetails(@Param('id') id: string) {
    return this.referralsService.getReferralDetails(id);
  }

  @Delete(':id')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete a referral link' })
  async deleteReferral(@Param('id') id: string) {
    return this.referralsService.deleteReferral(id);
  }
}
