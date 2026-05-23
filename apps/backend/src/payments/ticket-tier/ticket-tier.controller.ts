import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../../common/clerk-auth.guard';
import { TicketTierService } from './ticket-tier.service';
import { CreateTicketTierDto, UpdateTicketTierDto } from '@oppskills/types';

@Controller('events/:slug/tickets')
@UseGuards(ClerkAuthGuard)
export class EventTicketTierController {
  constructor(private readonly ticketTierService: TicketTierService) {}

  @Get()
  async list(
    @Param('slug') slug: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.ticketTierService.listEventTicketTiers(slug, req.user.id);
  }

  @Post()
  async create(
    @Param('slug') slug: string,
    @Req() req: { user: { id: string } },
    @Body() body: CreateTicketTierDto,
  ) {
    return this.ticketTierService.createEventTicketTier({
      eventSlug: slug,
      userId: req.user.id,
      ...body,
    });
  }

  @Patch(':tierId')
  async update(
    @Param('tierId') tierId: string,
    @Req() req: { user: { id: string } },
    @Body() body: UpdateTicketTierDto,
  ) {
    return this.ticketTierService.updateEventTicketTier({
      tierId,
      userId: req.user.id,
      ...body,
    });
  }

  @Delete(':tierId')
  async remove(
    @Param('tierId') tierId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.ticketTierService.deleteEventTicketTier(tierId, req.user.id);
  }
}

@Controller('hackathons/:slug/tickets')
@UseGuards(ClerkAuthGuard)
export class HackathonTicketTierController {
  constructor(private readonly ticketTierService: TicketTierService) {}

  @Get()
  async list(
    @Param('slug') slug: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.ticketTierService.listHackathonTicketTiers(slug, req.user.id);
  }

  @Post()
  async create(
    @Param('slug') slug: string,
    @Req() req: { user: { id: string } },
    @Body() body: CreateTicketTierDto,
  ) {
    return this.ticketTierService.createHackathonTicketTier({
      hackathonSlug: slug,
      userId: req.user.id,
      ...body,
    });
  }

  @Patch(':tierId')
  async update(
    @Param('tierId') tierId: string,
    @Req() req: { user: { id: string } },
    @Body() body: UpdateTicketTierDto,
  ) {
    return this.ticketTierService.updateHackathonTicketTier({
      tierId,
      userId: req.user.id,
      ...body,
    });
  }

  @Delete(':tierId')
  async remove(
    @Param('tierId') tierId: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.ticketTierService.deleteHackathonTicketTier(
      tierId,
      req.user.id,
    );
  }
}
