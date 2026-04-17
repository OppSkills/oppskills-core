import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { TrackReferralClickDto } from '@oppskills/types';
import { ReferralService } from './referral.service';

@Controller('referrals/public')
export class ReferralPublicController {
  constructor(private readonly referralService: ReferralService) {}

  @Get('resolve/:code')
  resolve(@Param('code') code: string) {
    return this.referralService.resolvePublic(code);
  }

  @Post('track-click')
  trackClick(@Body() dto: TrackReferralClickDto, @Req() req: Request) {
    const rawIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')?.[0] ||
      req.ip ||
      req.socket.remoteAddress ||
      '0.0.0.0';
    return this.referralService.trackPublicClick({
      code: dto.code,
      source: dto.source,
      ip: rawIp.trim(),
      userAgent: req.headers['user-agent'],
    });
  }
}
