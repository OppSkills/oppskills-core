import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  CreateReferralDto,
  ListReferralsQueryDto,
  LookupUserDto,
} from '@oppskills/types';
import { ClerkAuthGuard } from 'src/common/clerk-auth.guard';
import { ReferralService } from './referral.service';

@Controller('referrals')
@UseGuards(ClerkAuthGuard)
export class ReferralController {
  constructor(private readonly referralService: ReferralService) {}

  @Post()
  createReferral(@Body() dto: CreateReferralDto, @Req() req: Request) {
    return this.referralService.createReferral(dto, req.user!.id);
  }

  @Get('my/performance')
  getMyPerformance(@Req() req: Request) {
    return this.referralService.getMyReferralPerformance(req.user!.id);
  }

  @Get('my/referred-users')
  getMyReferredUsers(@Req() req: Request) {
    return this.referralService.getMyReferredUsers(req.user!.id);
  }

  @Get()
  listReferrals(@Query() query: ListReferralsQueryDto, @Req() req: Request) {
    return this.referralService.listReferrals(query, req.user!.id);
  }

  @Get('analytics')
  analytics(@Query() query: ListReferralsQueryDto, @Req() req: Request) {
    return this.referralService.analytics(query, req.user!.id);
  }

  @Get('user-lookup')
  lookupUser(@Query() dto: LookupUserDto, @Req() req: Request) {
    return this.referralService.lookupUser(dto, req.user!.id);
  }

  @Get(':id')
  getReferral(@Param('id') id: string, @Req() req: Request) {
    return this.referralService.getReferralById(id, req.user!.id);
  }

  @Get(':id/registrations')
  getRegistrations(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Req() req: Request,
  ) {
    return this.referralService.getReferralRegistrations(
      id,
      req.user!.id,
      Number(page || 1),
      Number(pageSize || 10),
    );
  }

  @Delete(':id')
  deleteReferral(@Param('id') id: string, @Req() req: Request) {
    return this.referralService.deleteReferral(id, req.user!.id);
  }
}
