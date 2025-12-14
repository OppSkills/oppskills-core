import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Logger } from 'src/_utils/logger';
import { ClerkAuthConfigService } from 'src/common/config.service';
import { prisma } from '@oppskills/db';
import * as crypto from 'crypto';
import {
  ClerkWebhookRequestDto,
  ClerkWebhookEventType,
} from '@oppskills/types';

@Injectable()
export class UserAccountsService {
  private readonly logger: Logger = new Logger(UserAccountsService.name);

  constructor(
    private readonly clerkAuthConfigService: ClerkAuthConfigService,
  ) {}

  async create({
    id,
    email,
    firstName,
    lastName,
    imageUrl,
  }: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  }) {
    try {
      const user = await prisma.userEntity.create({
        data: {
          id,
          email,
          firstName,
          lastName,
          imageUrl,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Error creating user account:`, error);
      throw error;
    }
  }

  async update({
    id,
    email,
    firstName,
    lastName,
    imageUrl,
  }: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  }) {
    try {
      const user = await prisma.userEntity.update({
        where: { id },
        data: {
          email,
          firstName,
          lastName,
          imageUrl,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(`Error updating user account:`, error);
      throw error;
    }
  }

  async delete({ user_id }: { user_id: string }) {
    try {
      const user = await prisma.userEntity.findUnique({
        where: { id: user_id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      await prisma.userEntity.delete({
        where: { id: user_id },
      });

      return {
        success: true,
        data: { user_id: user.id },
      };
    } catch (error) {
      this.logger.error(`Error deleting user account:`, error);
      throw error;
    }
  }

  private async verifyWebhookSignature(
    payload: string,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ): Promise<boolean> {
    try {
      const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
      const clerkWebhookSecret = this.clerkAuthConfigService.clerkWebhookSecret;

      if (!clerkWebhookSecret) {
        this.logger.error('Clerk webhook secret is not configured');
        return false;
      }

      const secretBytes = Buffer.from(
        clerkWebhookSecret.split('_')[1],
        'base64',
      );

      const expectedSignature = crypto
        .createHmac('sha256', secretBytes)
        .update(signedContent)
        .digest('base64');

      const signatures = svixSignature
        .split(' ')
        .map((sig) => sig.split(',')[1])
        .filter(Boolean);

      if (signatures.length === 0) {
        return false;
      }

      return signatures.some((actualSignature) =>
        crypto.timingSafeEqual(
          Buffer.from(expectedSignature),
          Buffer.from(actualSignature),
        ),
      );
    } catch (error) {
      this.logger.error(`Error verifying webhook signature`);
      return false;
    }
  }

  async handleClerkWebhook(
    payload: ClerkWebhookRequestDto,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ) {
    try {
      if (
        !(await this.verifyWebhookSignature(
          JSON.stringify(payload),
          svixId,
          svixTimestamp,
          svixSignature,
        ))
      ) {
        throw new HttpException(
          'Invalid webhook signature',
          HttpStatus.UNAUTHORIZED,
        );
      }

      switch (payload.type) {
        case ClerkWebhookEventType.USER_CREATED: {
          const userId = payload.data.id;
          this.logger.log(`Processing user creation: ${userId}`);

          const primaryEmail = payload.data.email_addresses.find(
            (email) => email.verification.status === 'verified',
          )?.email_address;

          if (!primaryEmail) {
            throw new HttpException(
              'No verified email address found',
              HttpStatus.BAD_REQUEST,
            );
          }

          try {
            if (userId && primaryEmail) {
              try {
                const userAccountAccess = await this.create({
                  id: userId,
                  email: primaryEmail,
                  firstName: payload.data.first_name,
                  lastName: payload.data.last_name,
                  imageUrl: payload.data.image_url,
                });

                return { success: true, data: userAccountAccess };
              } catch (error) {
                throw new HttpException(error?.message, HttpStatus.CONFLICT);
              }
            }
          } catch (error) {
            throw new HttpException(
              `Failed to create user: ${error?.message}`,
              error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          break;
        }

        case ClerkWebhookEventType.USER_UPDATED: {
          const clerkUserId = payload.data.id;
          this.logger.log(`Processing user update: ${clerkUserId}`);

          const primaryEmail = payload.data.email_addresses.find(
            (email) => email.verification.status === 'verified',
          )?.email_address;

          if (!primaryEmail) {
            throw new HttpException(
              'No verified email address found',
              HttpStatus.BAD_REQUEST,
            );
          }

          try {
            if (clerkUserId && primaryEmail) {
              try {
                const user = await this.update({
                  id: clerkUserId,
                  email: primaryEmail,
                  firstName: payload.data.first_name,
                  lastName: payload.data.last_name,
                  imageUrl: payload.data.image_url,
                });
                return { success: true, data: user };
              } catch (error) {
                if (error?.message?.includes('not found')) {
                  throw new HttpException(error?.message, HttpStatus.NOT_FOUND);
                }
                throw new HttpException(
                  error?.message,
                  HttpStatus.INTERNAL_SERVER_ERROR,
                );
              }
            }
          } catch (error) {
            throw new HttpException(
              `Failed to update user: ${error?.message}`,
              error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
          break;
        }

        case ClerkWebhookEventType.USER_DELETED: {
          const clerkUserId = payload.data.id;
          this.logger.log(`Processing user deletion: ${clerkUserId}`);

          if (clerkUserId) {
            try {
              const { success, data } = await this.delete({
                user_id: clerkUserId,
              });

              if (!success) {
                throw new HttpException(
                  'Failed to delete user account',
                  HttpStatus.INTERNAL_SERVER_ERROR,
                );
              }

              return {
                success: true,
                message: 'User account deleted successfully',
              };
            } catch (error) {
              this.logger.error(`Failed to delete user: `, error);
              if (error?.message?.includes('not found')) {
                throw new HttpException(error?.message, HttpStatus.NOT_FOUND);
              }
              throw new HttpException(
                error?.message,
                HttpStatus.INTERNAL_SERVER_ERROR,
              );
            }
          }
          break;
        }

        default:
          throw new HttpException(
            'Unhandled webhook event type',
            HttpStatus.BAD_REQUEST,
          );
      }
      return { success: false, message: 'Unhandled webhook event' };
    } catch (error) {
      this.logger.error(`Webhook handling error for ${payload.data.id}`);
      throw error;
    }
  }
}
