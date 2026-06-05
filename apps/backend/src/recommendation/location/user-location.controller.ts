import { Controller, Post, Body, Request } from '@nestjs/common';
import { Logger } from 'src/_utils/logger';
import { ClerkAuthConfigService } from 'src/common/config.service';
import { verifyToken } from '@clerk/backend';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Recommendation')
@Controller('location')
export class UserLocationController {
  private readonly logger = new Logger(UserLocationController.name);

  constructor(private readonly configService: ClerkAuthConfigService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit user coordinates',
    description:
      'Receives and logs user coordinates. Logs email if authenticated, otherwise Anonymous.',
  })
  @ApiResponse({
    status: 200,
    description: 'Coordinates successfully logged.',
  })
  async updateLocation(
    @Request() req: any,
    @Body() coords: { latitude: number; longitude: number },
  ) {
    let email = 'Anonymous';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          // Dev auth bypass check
          if (process.env.AUTH_BYPASS === 'true') {
            const headerUserId = req.headers['x-user-id'];
            if (
              typeof headerUserId === 'string' &&
              headerUserId.trim().length > 0
            ) {
              const userId = headerUserId.trim();
              email = req.headers['x-user-email'] || `${userId}@local.test`;
            }
          }

          if (email === 'Anonymous') {
            const sessionClaims = await verifyToken(token, {
              secretKey: this.configService.clerkSecretKey,
              clockSkewInMs: 15000,
            });
            const primaryEmail =
              sessionClaims.emailAddresses?.[0]?.emailAddress ||
              (typeof sessionClaims.email === 'string'
                ? sessionClaims.email
                : undefined) ||
              undefined;
            if (primaryEmail) {
              email = primaryEmail;
            } else if (sessionClaims.sub) {
              email = `User(${sessionClaims.sub})`;
            }
          }
        } catch (error) {
          this.logger.warn(
            'Failed to verify token in optional auth:',
            error instanceof Error ? error.message : error,
          );
        }
      }
    }

    this.logger.log(`User location - email: ${email}, coords:`, coords);
    return { success: true };
  }
}
