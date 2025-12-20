import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Logger,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserAccountsService } from './user-accounts.service';
import type { ClerkWebhookRequestDto } from '@oppskills/types';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';

@ApiTags('User Accounts')
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

  /**
   * Search users by email (for role assignment autocomplete).
   */
  @Get('/search')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Search users by email',
    description:
      'Search for users by email address (partial, case-insensitive match). Returns up to 10 results.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search query (email pattern)',
    type: 'string',
    example: 'john@',
  })
  @ApiResponse({
    status: 200,
    description: 'List of matching users',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string', nullable: true },
          lastName: { type: 'string', nullable: true },
          imageUrl: { type: 'string', nullable: true },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async searchUsers(@Query('q') query: string) {
    const safeQuery = typeof query === 'string' ? query : '';
    return this.userAccountsService.searchUsers(safeQuery);
  }
}
