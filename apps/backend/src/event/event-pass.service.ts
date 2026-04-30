import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import { Logger } from '../_utils/logger';
import type {
  EventPassDto,
  ScanResultDto,
  PublicPassLookupDto,
} from '@oppskills/types';

@Injectable()
export class EventPassService {
  private readonly logger = new Logger(EventPassService.name);

  /**
   * Generate a formatted ticket ID from participant ID
   * Format: № 001429 (using last 6 characters of participant ID)
   */
  private generateTicketId(participantId: string): string {
    const last6 = participantId.slice(-6).toUpperCase();
    return `№ ${last6}`;
  }

  /**
   * Generate an event pass for a participant
   * Creates pass in DB with unique token and formatted ticketId
   */
  async generateEventPass(participantId: string): Promise<EventPassDto> {
    // Check if pass already exists
    const existingPass = await prisma.eventPassEntity.findUnique({
      where: { participantId },
      include: {
        user: {
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
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (existingPass) {
      return this.mapToDto(existingPass);
    }

    // Get participant details
    const participant = await prisma.eventParticipantEntity.findUnique({
      where: { id: participantId },
      include: {
        user: {
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
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
      },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Generate ticket ID
    const ticketId = this.generateTicketId(participantId);

    // Check if ticketId already exists (unlikely but possible)
    const existingTicketId = await prisma.eventPassEntity.findUnique({
      where: { ticketId },
    });

    if (existingTicketId) {
      // If ticket ID collision, append a suffix
      const suffix = participantId.slice(-2).toUpperCase();
      const uniqueTicketId = `${ticketId}-${suffix}`;
      const pass = await prisma.eventPassEntity.create({
        data: {
          ticketId: uniqueTicketId,
          userId: participant.userId,
          eventId: participant.eventId,
          participantId: participant.id,
        },
        include: {
          user: {
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
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              startDate: true,
            },
          },
          scannedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
      return this.mapToDto(pass);
    }

    // Create new pass
    const pass = await prisma.eventPassEntity.create({
      data: {
        ticketId,
        userId: participant.userId,
        eventId: participant.eventId,
        participantId: participant.id,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapToDto(pass);
  }

  /**
   * Get pass by token (for viewing)
   */
  async getPassByToken(token: string): Promise<EventPassDto | null> {
    const pass = await prisma.eventPassEntity.findUnique({
      where: { token },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!pass) {
      return null;
    }

    return this.mapToDto(pass);
  }

  /**
   * Public lookup by token - returns limited info for security
   * Does NOT require authentication
   */
  async lookupPassByToken(token: string): Promise<PublicPassLookupDto | null> {
    const pass = await prisma.eventPassEntity.findUnique({
      where: { token },
      include: {
        user: {
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
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!pass) {
      return null;
    }

    const collegeName =
      pass.user?.onboardingProfile?.college?.name || undefined;
    const participantName =
      `${pass.user.firstName || ''} ${pass.user.lastName || ''}`.trim() ||
      'Participant';
    const scannedByName = pass.scannedBy
      ? `${pass.scannedBy.firstName || ''} ${pass.scannedBy.lastName || ''}`.trim() ||
        'Organizer'
      : undefined;

    return {
      ticketId: pass.ticketId,
      eventId: pass.eventId,
      eventSlug: pass.event.slug,
      isUsed: pass.isUsed,
      scannedAt: pass.scannedAt?.toISOString(),
      scannedByName,
      participant: {
        name: participantName,
        email: pass.user.email,
        imageUrl: pass.user.imageUrl || undefined,
        collegeName,
      },
      event: {
        name: pass.event.name,
        startDate: pass.event.startDate.toISOString(),
      },
    };
  }

  /**
   * Get pass by ID (for authenticated user)
   */
  async getPassById(passId: string, userId: string): Promise<EventPassDto> {
    const pass = await prisma.eventPassEntity.findUnique({
      where: { id: passId },
      include: {
        user: {
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
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!pass) {
      throw new NotFoundException('Event pass not found');
    }

    // Verify user owns this pass
    if (pass.userId !== userId) {
      throw new NotFoundException('Event pass not found');
    }

    return this.mapToDto(pass);
  }

  /**
   * Get all passes for a user
   */
  async getPassesByUserId(userId: string): Promise<EventPassDto[]> {
    const passes = await prisma.eventPassEntity.findMany({
      where: { userId },
      include: {
        user: {
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
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return passes.map((pass) => this.mapToDto(pass));
  }

  /**
   * Validate and scan a pass token
   * Returns scan result with participant details
   */
  async validateAndScanPass(
    token: string,
    scannerId: string,
    eventId: string,
  ): Promise<ScanResultDto> {
    // Find pass by token
    const pass = await prisma.eventPassEntity.findUnique({
      where: { token },
      include: {
        user: {
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
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!pass) {
      throw new NotFoundException('Invalid pass token');
    }

    // Verify pass belongs to the event being scanned
    if (pass.eventId !== eventId) {
      throw new BadRequestException('This pass does not belong to this event');
    }

    const wasAlreadyUsed = pass.isUsed;

    // If not already used, mark as scanned
    if (!pass.isUsed) {
      await prisma.eventPassEntity.update({
        where: { id: pass.id },
        data: {
          isUsed: true,
          scannedAt: new Date(),
          scannedById: scannerId,
        },
      });

      // Update the pass object for response
      pass.isUsed = true;
      pass.scannedAt = new Date();
      pass.scannedById = scannerId;
    }

    const message = wasAlreadyUsed
      ? `Pass was already scanned on ${pass.scannedAt?.toLocaleString()} by ${pass.scannedBy?.firstName || 'Unknown'}`
      : 'Pass validated successfully. Entry granted.';

    return {
      success: true,
      pass: this.mapToDto(pass),
      message,
      wasAlreadyUsed,
    };
  }

  /**
   * Mark attendance manually for a participant
   * Creates a pass if it doesn't exist, and marks it as used
   */
  async markAttendanceManually(
    participantId: string,
    scannerId: string,
    eventId: string,
  ): Promise<ScanResultDto> {
    // 1. Check if pass exists
    let pass = await prisma.eventPassEntity.findUnique({
      where: { participantId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // 2. If not, generate one
    if (!pass) {
      await this.generateEventPass(participantId);
      pass = await prisma.eventPassEntity.findUnique({
        where: { participantId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              imageUrl: true,
            },
          },
          event: {
            select: {
              id: true,
              name: true,
              slug: true,
              startDate: true,
            },
          },
          scannedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    if (!pass) {
      throw new NotFoundException('Failed to create or find event pass');
    }

    // 3. Verify eventId
    if (pass.eventId !== eventId) {
      throw new BadRequestException(
        'Participant does not belong to this event',
      );
    }

    const wasAlreadyUsed = pass.isUsed;

    // 4. Mark as used
    if (!pass.isUsed) {
      await prisma.eventPassEntity.update({
        where: { id: pass.id },
        data: {
          isUsed: true,
          scannedAt: new Date(),
          scannedById: scannerId,
        },
      });

      // Update object for response mapping
      pass.isUsed = true;
      pass.scannedAt = new Date();
      pass.scannedById = scannerId;
      
      // Fetch scannedBy info for the DTO
      const scanner = await prisma.userEntity.findUnique({
        where: { id: scannerId },
        select: { id: true, firstName: true, lastName: true },
      });
      pass.scannedBy = scanner;
    }

    return {
      success: true,
      pass: this.mapToDto(pass),
      message: wasAlreadyUsed
        ? 'Already marked present'
        : 'Marked present successfully',
      wasAlreadyUsed,
    };
  }

  /**
   * Get all scanned passes for an event
   * Only event owners/managers should call this
   */
  async getScannedPasses(eventId: string): Promise<EventPassDto[]> {
    const passes = await prisma.eventPassEntity.findMany({
      where: {
        eventId,
        isUsed: true,
      },
      include: {
        user: {
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
          },
        },
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            startDate: true,
          },
        },
        scannedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scannedAt: 'desc' },
    });

    return passes.map((pass) => this.mapToDto(pass));
  }

  /**
   * Map Prisma model to DTO
   */
  private mapToDto(pass: any): EventPassDto {
    const collegeName =
      pass.user?.onboardingProfile?.college?.name || 'College Name';

    return {
      id: pass.id,
      ticketId: pass.ticketId,
      token: pass.token,
      userId: pass.userId,
      eventId: pass.eventId,
      participantId: pass.participantId,
      isUsed: pass.isUsed,
      scannedAt: pass.scannedAt?.toISOString(),
      scannedBy: pass.scannedBy
        ? {
            id: pass.scannedBy.id,
            name:
              `${pass.scannedBy.firstName || ''} ${pass.scannedBy.lastName || ''}`.trim() ||
              'Unknown',
          }
        : undefined,
      createdAt: pass.createdAt.toISOString(),
      user: {
        id: pass.user.id,
        firstName: pass.user.firstName || '',
        lastName: pass.user.lastName || '',
        email: pass.user.email,
        imageUrl: pass.user.imageUrl || undefined,
        collegeName,
      },
      event: {
        id: pass.event.id,
        name: pass.event.name,
        slug: pass.event.slug,
        startDate: pass.event.startDate.toISOString(),
      },
    };
  }
}
