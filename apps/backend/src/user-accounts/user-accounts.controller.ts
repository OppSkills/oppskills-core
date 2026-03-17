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
  BadRequestException,
} from '@nestjs/common';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
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

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

  @IsOptional()
  @IsEnum([
    'SCHOOL_STUDENT',
    'COLLEGE_STUDENT',
    'WORKING_PROFESSIONAL',
    'FRESHER',
    'PROFESSIONAL_SCHOOL_STUDENT',
  ])
  userCategory?:
    | 'SCHOOL_STUDENT'
    | 'COLLEGE_STUDENT'
    | 'WORKING_PROFESSIONAL'
    | 'FRESHER'
    | 'PROFESSIONAL_SCHOOL_STUDENT';
}

class UpdateEducationDto {
  @IsOptional()
  @IsString()
  collegeId?: string | null;

  @IsOptional()
  @IsString()
  collegeName?: string;

  @IsOptional()
  @IsString()
  course?: string;

  @IsOptional()
  @IsString()
  courseSpecialization?: string;

  @IsOptional()
  @IsString()
  startYear?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  @Type(() => Number)
  endYear?: number;

  @IsOptional()
  @IsString()
  rollNumber?: string;

  @IsOptional()
  @IsString()
  cgpa?: string;
}

@ApiTags('User Accounts')
@Controller('user-accounts')
export class UserAccountsController {
  private readonly logger: Logger = new Logger(UserAccountsController.name);
  constructor(private readonly userAccountsService: UserAccountsService) { }

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
    @Request() req: { user: { id: string } },
    @Body() onboardingData: CreateOnboardingDto,
  ) {
    return this.userAccountsService.submitOnboarding(
      req.user.id,
      onboardingData,
    );
  }

  /**
   * Get comprehensive profile data including stats/achievements.
   */
  @Get('/profile')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({
    summary: 'Get comprehensive profile data',
    description:
      'Returns the current user full profile including personal, education, skills, stats, and achievements.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive User profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async getFullProfile(
    @Request()
    req: {
      user?: {
        id?: string;
      };
    },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Unauthorized');
    }
    return this.userAccountsService.getFullProfile(userId);
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

  /**
   * Update user skills.
   */
  @Patch('/skills')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Update user skills' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async updateSkills(
    @Request() req: { user: { id: string } },
    @Body('skills') skills: string[],
  ) {
    const validatedSkills = this.validateArray(skills, 'Skills');
    return this.userAccountsService.updateSkills(req.user.id, validatedSkills);
  }

  /**
   * Update user interests.
   */
  @Patch('/interests')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Update user interests' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        interests: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async updateInterests(
    @Request() req: { user: { id: string } },
    @Body('interests') interests: string[],
  ) {
    const validatedInterests = this.validateArray(interests, 'Interests');
    return this.userAccountsService.updateInterests(
      req.user.id,
      validatedInterests,
    );
  }

  /**
   * Update comprehensive user profile.
   */
  @Patch('/profile')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  async updateProfile(
    @Request() req: { user: { id: string } },
    @Body() profileData: UpdateProfileDto,
  ) {
    return this.userAccountsService.updateProfile(req.user.id, profileData);
  }

  /**
   * Update education info.
   */
  @Patch('/education')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @ApiOperation({ summary: 'Update user education' })
  @ApiBody({ type: UpdateEducationDto })
  async updateEducation(
    @Request() req: { user: { id: string } },
    @Body() educationData: UpdateEducationDto,
  ) {
    return this.userAccountsService.updateEducation(req.user.id, educationData);
  }

  /**
   * Internal helper to validate input arrays (XSS prevention, pattern check).
   */
  private validateArray(arr: any, fieldName: string): string[] {
    if (!Array.isArray(arr)) {
      throw new BadRequestException(`${fieldName} must be an array`);
    }

    if (arr.length > 20) {
      throw new BadRequestException(`${fieldName} cannot exceed 20 items`);
    }

    return arr
      .map((item) => {
        if (typeof item !== 'string') {
          throw new BadRequestException(`All ${fieldName} items must be strings`);
        }
        const trimmed = item.trim();

        // Max length constraint for security/sanity
        if (trimmed.length > 50) {
          throw new BadRequestException(
            `${fieldName} items must be under 50 characters`,
          );
        }

        // Pattern: Alpha-numeric, spaces, and common tech symbols (+, #, -, ., /)
        // This prevents XSS and malicious scripts.
        if (trimmed.length > 0 && !/^[a-zA-Z0-9\s\+\#\-\.\/]+$/.test(trimmed)) {
          throw new BadRequestException(
            `Invalid characters in ${fieldName}: "${trimmed}"`,
          );
        }

        return trimmed;
      })
      .filter((t) => t.length > 0);
  }
}
