import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { Logger } from 'src/_utils/logger';

@Injectable()
export class WaitlistService {
  private readonly logger: Logger = new Logger(WaitlistService.name);

  /**
   * Add user to waitlist for a feature.
   */
  async addToWaitlist(userId: string, feature: string): Promise<{ success: boolean; message: string }> {
    if (!feature || feature.trim().length === 0) {
      throw new BadRequestException('Feature identifier is required');
    }

    // Normalize feature identifier
    const normalizedFeature = feature.trim().toLowerCase().replace(/\s+/g, '-');

    try {
      // Check if user is already on waitlist for this feature
      const existing = await prisma.featureWaitlistEntity.findUnique({
        where: {
          userId_feature: {
            userId,
            feature: normalizedFeature,
          },
        },
      });

      if (existing) {
        throw new ConflictException('You are already on the waitlist for this feature');
      }

      // Add to waitlist
      await prisma.featureWaitlistEntity.create({
        data: {
          userId,
          feature: normalizedFeature,
        },
      });

      this.logger.log(`User ${userId} added to waitlist for feature: ${normalizedFeature}`);

      return {
        success: true,
        message: 'Successfully added to waitlist!',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error adding user to waitlist: ${error}`);
      throw new BadRequestException('Failed to add to waitlist. Please try again.');
    }
  }

  /**
   * Check if user is on waitlist for a feature.
   */
  async isOnWaitlist(userId: string, feature: string): Promise<boolean> {
    const normalizedFeature = feature.trim().toLowerCase().replace(/\s+/g, '-');

    const entry = await prisma.featureWaitlistEntity.findUnique({
      where: {
        userId_feature: {
          userId,
          feature: normalizedFeature,
        },
      },
    });

    return !!entry;
  }
}

