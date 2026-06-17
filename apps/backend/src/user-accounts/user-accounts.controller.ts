import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Patch,
  Param,
  Delete,
  Headers,
  Logger,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { UserAccountsService } from './user-accounts.service';
import { CreateOnboardingDto } from '@oppskills/types';
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
   * Get current user profile with onboarding status.
   */
  @Get('/me')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Get current user profile',
    description:
      'Returns the current user profile including onboarding status and profile data.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile with onboarding data',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        imageUrl: { type: 'string', nullable: true },
        firstName: { type: 'string', nullable: true },
        lastName: { type: 'string', nullable: true },
        accessLevel: { type: 'string' },
        onboarded: { type: 'boolean' },
        onboardingProfile: {
          type: 'object',
          nullable: true,
        },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getMe(
    @Request()
    req: {
      user?: {
        id?: string;
        email?: string;
      };
    },
  ) {
    const userId = req.user?.id;
    const email = req.user?.email;
    // Delegate validation + fallback logic to the service (single source of truth).
    return this.userAccountsService.getMe({ userId, email });
  }

  /**
   * Submit or update onboarding profile.
   */
  @Put('/onboarding')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Submit onboarding profile',
    description:
      'Create or update user onboarding profile. Sets user as onboarded after successful submission.',
  })
  @ApiBody({
    description: 'Onboarding profile data',
  })
  @ApiResponse({
    status: 200,
    description: 'Onboarding profile saved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        onboardingProfile: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid onboarding data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async submitOnboarding(
    @Request() req: { user: { id: string; email?: string } },
    @Body() onboardingData: CreateOnboardingDto,
  ) {
    return this.userAccountsService.submitOnboarding(
      req.user.id,
      req.user.email,
      onboardingData,
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
