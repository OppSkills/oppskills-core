import { Controller, Get, Post, Body, Patch, Param, Delete, Headers, Logger } from '@nestjs/common';
import { UserAccountsService } from './user-accounts.service';
import type { ClerkWebhookRequestDto } from '@oppskills/types';

@Controller('user-accounts')
export class UserAccountsController {
  private readonly logger: Logger = new Logger(UserAccountsController.name);
  constructor(private readonly userAccountsService: UserAccountsService) {}

  @Post('/clerk-webhook')
  create(
    @Body() createUserAccountDto: ClerkWebhookRequestDto,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    this.logger.log(`[clerk-webhook] Received webhook request`);
    this.logger.log(
      `[clerk-webhook] Input - svixId: ${svixId}, svixTimestamp: ${svixTimestamp}, body:`,
      createUserAccountDto,
    );
    return this.userAccountsService.handleClerkWebhook(
      createUserAccountDto,
      svixId,
      svixTimestamp,
      svixSignature,
    );
  } 
}
