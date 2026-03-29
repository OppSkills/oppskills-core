import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { RegistrationSubmitService } from './registration-submit.service';
import { SubmitRegistrationDto } from './dto';

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class RegistrationSubmitController {
  constructor(
    private readonly registrationSubmitService: RegistrationSubmitService,
  ) {}

  @Get(':slug/registrations/status')
  async getRegistrationStatus(
    @Param('slug') slug: string,
    @Req() req: { user: { id: string } },
  ) {
    return this.registrationSubmitService.getRegistrationStatus(
      slug,
      req.user.id,
    );
  }

  @Post(':slug/registrations/submit')
  async submitRegistration(
    @Param('slug') slug: string,
    @Body() dto: SubmitRegistrationDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.registrationSubmitService.submitRegistration({
      hackathonSlug: slug,
      userId: req.user.id,
      answers: dto.answers,
    });
  }
}
