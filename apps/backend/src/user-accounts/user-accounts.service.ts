import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from 'src/_utils/logger';
import { ClerkAuthConfigService } from 'src/common/config.service';
import { prisma, UserCategory } from '@oppskills/db';
import * as crypto from 'crypto';
import {
  ClerkWebhookRequestDto,
  ClerkWebhookEventType,
  CreateOnboardingDto,
  UserCategoryValue,
} from '@oppskills/types';
import {
  EMAIL_EVENTS,
  UserCreatedEventPayload,
  UserOnboardedEventPayload,
} from 'src/email/email.events';
import { CollegesService } from 'src/colleges/colleges.service';

@Injectable()
export class UserAccountsService {
  private readonly logger: Logger = new Logger(UserAccountsService.name);

  constructor(
    private readonly clerkAuthConfigService: ClerkAuthConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly collegesService: CollegesService,
  ) { }

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
          onboarded: false,
          onboardingProfile: {
            create: {
              userCategory: UserCategory.COLLEGE_STUDENT,
              gender: 'MALE',
            },
          },
        },
        include: {
          onboardingProfile: true,
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

  /**
   * Search users by email (case-insensitive, partial match).
   * Returns up to 10 matching users.
   */
  async searchUsers(query: string) {
    const normalizedQuery = query.toLowerCase().trim();

    if (normalizedQuery.length === 0) {
      return [];
    }

    const users = await prisma.userEntity.findMany({
      where: {
        email: {
          contains: normalizedQuery,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        imageUrl: true,
      },
      take: 10,
      orderBy: { email: 'asc' },
    });

    return users;
  }

  /**
   * Get current user profile with onboarding status.
   * Includes college details for prefilling registration forms.
   */
  async getMe(input: {
    userId: string | undefined;
    email: string | undefined;
  }) {
    const userId = typeof input.userId === 'string' ? input.userId.trim() : '';
    const email = typeof input.email === 'string' ? input.email.trim() : '';

    if (userId.length === 0) {
      throw new HttpException(
        'Missing authenticated user id.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Include college relation to get college name for prefilling
    const include = {
      onboardingProfile: {
        include: {
          college: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    } as const;

    // 1) Primary lookup: DB primary key should ideally be the Clerk user id.
    const byId = await prisma.userEntity.findUnique({
      where: { id: userId },
      include,
    });
    if (byId) return byId;

    // 2) Backwards-compat: some environments may have users created with cuid() ids.
    // In that case, the only stable linkage we have is email (unique).
    if (email.length > 0) {
      const byEmail = await prisma.userEntity.findUnique({
        where: { email },
        include,
      });
      if (byEmail) return byEmail;

      // 3) If neither exists, create the row so downstream flows work.
      // Note: if a race/dup happens, we re-fetch by email.
      try {
        const created = await prisma.userEntity.create({
          data: {
            id: userId,
            email,
            // Optional profile fields are unknown here; webhook can fill later.
            firstName: null,
            lastName: null,
            imageUrl: null,
            onboarded: false,
            onboardingProfile: {
              create: {
                userCategory: UserCategory.COLLEGE_STUDENT,
                gender: 'MALE', // Default
              },
            },
          },
          include,
        });
        return created;
      } catch (error) {
        this.logger.warn('[getMe] Failed to create user; retrying by email.', {
          userId,
          email,
          error: error instanceof Error ? error.message : `${error}`,
        });

        const retry = await prisma.userEntity.findUnique({
          where: { email },
          include,
        });
        if (retry) return retry;
      }
    }

    throw new HttpException(
      `User not found for id "${userId}"${email.length > 0 ? ` or email "${email}"` : ''}`,
      HttpStatus.NOT_FOUND,
    );
  }

  /**
   * Get comprehensive user profile for the frontend.
   * Derives achievements and stats dynamically.
   */
  async getFullProfile(userId: string) {
    if (!userId || userId.trim().length === 0) {
      throw new HttpException('Missing user id', HttpStatus.UNAUTHORIZED);
    }

    const user = await prisma.userEntity.findUnique({
      where: { id: userId },
      include: {
        onboardingProfile: {
          include: {
            college: {
              select: {
                name: true,
              },
            },
          },
        },
        eventParticipations: {
          select: { id: true },
        },
        hackathonRegistrationSubmissions: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const profile = user.onboardingProfile;

    // Build personal info
    const personalInfo = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      imageUrl: user.imageUrl,
      gender: profile?.gender || null,
      userCategory: profile?.userCategory || null,
    };

    // Build education info
    const educationInfo = {
      collegeName: profile?.college?.name || null,
      collegeCurrentYear: profile?.collegeCurrentYear || null,
      collegePassoutYear: profile?.collegePassoutYear || null,
      schoolName: profile?.schoolName || null,
      schoolClass: profile?.schoolClass || null,
    };

    // Stats
    const eventCount = user.eventParticipations.length;
    const hackathonCount = user.hackathonRegistrationSubmissions.length;

    const stats = {
      events: eventCount,
      hackathon: hackathonCount,
      certificates: 0
    };

    return {
      personalInfo,
      educationInfo,
      skills: profile?.skills || [],
      interests: profile?.interests || [],
      stats,
    };
  }

  /**
   * Submit or update onboarding profile.
   * Validates conditional fields and upserts the profile.
   */
  async submitOnboarding(userId: string, data: CreateOnboardingDto) {
    // Resolve college if passing name instead of ID
    if (
      !data.collegeSkipped &&
      (!data.collegeId || data.collegeId.trim().length === 0) &&
      (data as any).collegeName && // Cast to any to avoid type check until package rebuild
      (data as any).collegeName.trim().length > 0
    ) {
      // Validate location presence before creating college
      if (data.locationCity && data.locationState && data.locationCountry) {
        try {
          const college = await this.collegesService.findOrCreateCollege(
            (data as any).collegeName,
            {
              city: data.locationCity,
              state: data.locationState,
              country: data.locationCountry,
            },
          );
          data.collegeId = college.id;
        } catch (error) {
          this.logger.warn(`Failed to resolve college`, error);
          // Allow validation to fail naturally if resolution failed
        }
      }
    }

    // Validate conditional requirements
    this.validateOnboardingData(data);

    try {
      // Use atomic update with nested upsert instead of interactive transaction
      // This prevents connection pool exhaustion and transaction timeouts
      const result = await prisma.userEntity.update({
        where: { id: userId },
        data: {
          onboarded: true,
          onboardingProfile: {
            upsert: {
              update: {
                gender: data.gender,
                userCategory: data.userCategory,
                schoolName: data.schoolName || null,
                schoolClass: data.schoolClass || null,
                schoolAddress: data.schoolAddress || null,
                collegeId: data.collegeId || null,
                collegeCurrentYear: data.collegeCurrentYear || null,
                collegePassoutYear: data.collegePassoutYear || null,
                collegeSkipped: data.collegeSkipped || false,
                companyName: data.companyName || null,
                jobTitle: data.jobTitle || null,
                locationCity: data.locationCity,
                locationState: data.locationState,
                locationCountry: data.locationCountry,
                interests: data.interests || [],
                skills: data.skills || [],
                experienceLevel: data.experienceLevel || null,
                teamPreference: data.teamPreference || null,
              },
              create: {
                gender: data.gender,
                userCategory: data.userCategory,
                schoolName: data.schoolName || null,
                schoolClass: data.schoolClass || null,
                schoolAddress: data.schoolAddress || null,
                collegeId: data.collegeId || null,
                collegeCurrentYear: data.collegeCurrentYear || null,
                collegePassoutYear: data.collegePassoutYear || null,
                collegeSkipped: data.collegeSkipped || false,
                companyName: data.companyName || null,
                jobTitle: data.jobTitle || null,
                locationCity: data.locationCity,
                locationState: data.locationState,
                locationCountry: data.locationCountry,
                interests: data.interests || [],
                skills: data.skills || [],
                experienceLevel: data.experienceLevel || null,
                teamPreference: data.teamPreference || null,
              },
            },
          },
        },
        include: {
          onboardingProfile: true, // Return the profile
        },
      });

      // Emit user.onboarded event for onboarding complete email
      const eventPayload: UserOnboardedEventPayload = {
        userId,
        email: result.email,
        firstName: result.firstName || undefined,
        userCategory: data.userCategory,
        locationCity: data.locationCity,
      };
      this.eventEmitter.emit(EMAIL_EVENTS.USER_ONBOARDED, eventPayload);

      return {
        success: true,
        message: 'Onboarding completed successfully',
        onboardingProfile: result.onboardingProfile,
      };
    } catch (error) {
      this.logger.error(
        `Error submitting onboarding for user ${userId}:`,
        error,
      );
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to save onboarding profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validates onboarding data based on user category and common required fields.
   */
  private validateOnboardingData(data: CreateOnboardingDto) {
    // 1. Common required fields for everyone
    if (!data.locationCity || data.locationCity.trim().length === 0) {
      throw new HttpException('City is required', HttpStatus.BAD_REQUEST);
    }
    if (!data.locationState || data.locationState.trim().length === 0) {
      throw new HttpException('State is required', HttpStatus.BAD_REQUEST);
    }
    if (!data.locationCountry || data.locationCountry.trim().length === 0) {
      throw new HttpException('Country is required', HttpStatus.BAD_REQUEST);
    }

    // 2. Interests and Skills (optional - sanitize if provided)
    // If interests are provided, ensure they are valid strings and sanitize
    if (data.interests !== undefined && data.interests !== null) {
      if (!Array.isArray(data.interests)) {
        throw new HttpException(
          'Interests must be an array',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Sanitize: filter out empty strings and non-string values
      const sanitizedInterests = data.interests
        .filter((i) => typeof i === 'string' && i.trim().length > 0)
        .map((i) => i.trim());
      // Replace with sanitized array (can be empty)
      data.interests = sanitizedInterests;
    }

    // If skills are provided, ensure they are valid strings and sanitize
    if (data.skills !== undefined && data.skills !== null) {
      if (!Array.isArray(data.skills)) {
        throw new HttpException(
          'Skills must be an array',
          HttpStatus.BAD_REQUEST,
        );
      }
      // Sanitize: filter out empty strings and non-string values
      const sanitizedSkills = data.skills
        .filter((s) => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim());
      // Replace with sanitized array (can be empty)
      data.skills = sanitizedSkills;
    }

    // 3. Category specific rules
    switch (data.userCategory) {
      case UserCategoryValue.SCHOOL_STUDENT:
        // Required: schoolName, schoolClass
        // Optional: schoolAddress
        if (!data.schoolName || data.schoolName.trim().length === 0) {
          throw new HttpException(
            'School name is required for school students',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (!data.schoolClass || data.schoolClass.trim().length === 0) {
          throw new HttpException(
            'School class is required for school students',
            HttpStatus.BAD_REQUEST,
          );
        }
        // schoolAddress is optional - no validation required
        break;

      case UserCategoryValue.COLLEGE_STUDENT:
      case UserCategoryValue.PROFESSIONAL_SCHOOL_STUDENT:
        // Required: collegeId or collegeName (unless collegeSkipped=true)
        // Optional: collegeCurrentYear, collegePassoutYear
        if (
          !data.collegeSkipped &&
          (!data.collegeId || data.collegeId.trim().length === 0) &&
          (!(data as any).collegeName ||
            (data as any).collegeName.trim().length === 0)
        ) {
          throw new HttpException(
            'College is required unless skipped',
            HttpStatus.BAD_REQUEST,
          );
        }
        // collegeCurrentYear is optional - no validation required
        break;

      case UserCategoryValue.FRESHER:
        // Freshers: No college requirements
        // College fields are optional - user can add them if they want
        break;

      case UserCategoryValue.WORKING_PROFESSIONAL:
        // Working professionals: No college requirements
        // All education fields are optional
        break;
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

                // Emit user.created event for welcome email
                const eventPayload: UserCreatedEventPayload = {
                  userId,
                  email: primaryEmail,
                  firstName: payload.data.first_name || undefined,
                  lastName: payload.data.last_name || undefined,
                };
                this.eventEmitter.emit(EMAIL_EVENTS.USER_CREATED, eventPayload);

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

  async updateSkills(
    userId: string,
    skills: string[],
  ) {
    try {
      const user = await prisma.userEntity.findUnique({
        where: { id: userId },
        include: {
          onboardingProfile: true,
        },
      });

      if (!user || !user.onboardingProfile) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return await prisma.userOnboardingProfileEntity.update({
        where: { id: user.onboardingProfile.id },
        data: {
          skills: skills,
        },
      });
    } catch (error) {
      throw new HttpException(
        error?.message,
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateInterests(
    userId: string,
    interests: string[],
  ) {
    try {
      const user = await prisma.userEntity.findUnique({
        where: { id: userId },
        include: {
          onboardingProfile: true,
        },
      });

      if (!user || !user.onboardingProfile) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return await prisma.userOnboardingProfileEntity.update({
        where: { id: user.onboardingProfile.id },
        data: {
          interests: interests,
        },
      });
    } catch (error) {
      throw new HttpException(
        error?.message,
        error?.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
