import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { WaitlistService } from './waitlist.service';
import { ClerkAuthGuard } from '../common/clerk-auth.guard';

@ApiTags('Waitlist')
@ApiBearerAuth('clerk-auth')
@Controller('waitlist')
@UseGuards(ClerkAuthGuard)
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @ApiOperation({
    summary: 'Add user to feature waitlist',
    description:
      'Adds the authenticated user to the waitlist for a specific feature.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        feature: {
          type: 'string',
          description:
            'Feature identifier (e.g., "skill-based-learning-tracks", "mentor-led-sessions")',
          example: 'skill-based-learning-tracks',
        },
      },
      required: ['feature'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Successfully added to waitlist',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid feature identifier',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already on waitlist',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async addToWaitlist(
    @Request()
    req: {
      user?: {
        id?: string;
      };
    },
    @Body() body: { feature: string },
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.waitlistService.addToWaitlist(userId, body.feature);
  }

  @Get(':feature')
  @ApiOperation({
    summary: 'Check if user is on waitlist',
    description:
      'Checks if the authenticated user is on the waitlist for a specific feature.',
  })
  @ApiParam({
    name: 'feature',
    description: 'Feature identifier',
    example: 'skill-based-learning-tracks',
  })
  @ApiResponse({
    status: 200,
    description: 'Waitlist status',
    schema: {
      type: 'object',
      properties: {
        isOnWaitlist: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  async checkWaitlistStatus(
    @Request()
    req: {
      user?: {
        id?: string;
      };
    },
    @Param('feature') feature: string,
  ) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    const isOnWaitlist = await this.waitlistService.isOnWaitlist(
      userId,
      feature,
    );
    return { isOnWaitlist };
  }
}
