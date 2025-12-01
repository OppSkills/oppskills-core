import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,  UnauthorizedException,
  Patch,
  Param,
  Delete
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { HackathonService } from './hackathon.service';
import type { CreateHackathonDto } from '@oppskills/types';
import type { Request } from 'express';
import { Logger } from '../_utils/logger';

@Controller('hackathon')
@UseGuards(ClerkAuthGuard)
export class HackathonController {

  private readonly logger = new Logger(HackathonController.name);

  constructor(private readonly hackathonService: HackathonService) {}

  @Post()
  async createHackathon(
    @Body() dto: CreateHackathonDto,
    @Req() req: Request,
  ) {
    const user = req['user'];
    const userId = user?.id;
    
   if (!userId) throw new UnauthorizedException('User not found');

    this.logger.log(`Creating hackathon by user: ${userId}`);

    const hackathon = await this.hackathonService.createHackathon(dto, userId!);
    return {
      message: 'Hackathon created successfully!',
      data: hackathon,
    };
  }

  @Get()
  async getAllHackathons() {
    return this.hackathonService.getAllHackathons();
  }

  @Patch(':id')
  async updateHackathon(@Param('id') id: string, @Body() dto: CreateHackathonDto, @Req() req: Request){
  const user = req['user'];
  if (!user)throw new UnauthorizedException('User Not Found');
  return this.hackathonService.updateHackathon(id, dto, user.id);
  }

  @Delete(':id')
  async deleteHackathon(@Param('id') id: string, @Req() req: Request){
  const user = req['user'];
  if(!user) throw new UnauthorizedException("User Not FOund");
  return this.hackathonService.deleteHackathon(id, user.id); 

  }

  @Post(':id/register')
  async registerForHackathon(@Param('id') hackathonId: string, @Req() req: Request){
    const user = req['user'];
    if(!user) throw new UnauthorizedException('User Not Found');
    return this.hackathonService.registerForHackathon(hackathonId, user.id);
  }
}
