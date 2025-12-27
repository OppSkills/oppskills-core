import { Controller, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';
import { RegistrationSubmitService } from './registration-submit.service';

interface SubmitRegistrationDto {
  answers: Array<{ fieldId: string; value: string }>;
}

@Controller('hackathons')
@UseGuards(ClerkAuthGuard)
export class RegistrationSubmitController {
  constructor(
    private readonly registrationSubmitService: RegistrationSubmitService,
  ) {}

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
