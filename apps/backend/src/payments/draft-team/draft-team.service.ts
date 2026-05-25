import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  prisma,
  LifecycleStatus,
  ApprovalStatus,
  HackathonChargeMode,
  HackathonPaymentScope,
  HackathonPaymentStatus,
} from '@oppskills/db';
import { Decimal } from '@prisma/client/runtime/library';
import { Logger } from 'src/_utils/logger';
import { EMAIL_EVENTS } from 'src/email/email.events';
import { ReferralService } from 'src/referral/referral.service';

/**
 * Get max team size from participant type.
 */
function getMaxSizeFromParticipantType(participantType: string): number {
  switch (participantType) {
    case 'INDIVIDUAL':
      return 1;
    case 'TEAM_OF_2':
      return 2;
    case 'TEAM_OF_3':
      return 3;
    case 'TEAM_OF_4':
      return 4;
    case 'TEAM_OF_5':
      return 5;
    case 'TEAM_OF_6':
      return 6;
    case 'MORE_THAN_6':
      return 10;
    case 'TEAM_OF_2_3':
      return 3;
    case 'TEAM_OF_2_4':
      return 4;
    case 'TEAM_OF_3_4':
      return 4;
    case 'TEAM_OF_3_5':
      return 5;
    case 'TEAM_OF_4_5':
      return 5;
    case 'TEAM_OF_4_6':
      return 6;
    case 'TEAM_OF_5_6':
      return 6;
    default:
      return 4;
  }
}

@Injectable()
export class DraftTeamService {
  private readonly logger = new Logger(DraftTeamService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly referralService: ReferralService,
  ) {}

  private buildUserDisplayName(user: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  }): string {
    const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    return name || user.email || 'Participant';
  }

  private emitHackathonJoinConfirmation(payload: {
    email: string | null | undefined;
    userName: string;
    hackathonName: string;
    teamName: string;
  }): void {
    if (!payload.email) {
      this.logger.warn(
        `Skipping hackathon join confirmation: missing email for ${payload.userName}`,
      );
      return;
    }
    try {
      this.eventEmitter.emit(EMAIL_EVENTS.HACKATHON_JOIN_CONFIRMATION, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to emit hackathon join confirmation event: ${message}`,
      );
    }
  }

  private emitHackathonNewMemberJoined(payload: {
    leaderEmail: string | null | undefined;
    teamLeaderName: string;
    newMemberName: string;
    teamName: string;
    hackathonName: string;
  }): void {
    if (!payload.leaderEmail) {
      this.logger.warn(
        `Skipping leader notification: missing leader email for team ${payload.teamName}`,
      );
      return;
    }
    try {
      this.eventEmitter.emit(EMAIL_EVENTS.HACKATHON_NEW_MEMBER_JOINED, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to emit new member joined event: ${message}`);
    }
  }

  async createDraftTeam(params: {
    hackathonSlug: string;
    name: string;
    maxSize?: number;
    leaderId: string;
  }) {
    const { hackathonSlug, name, maxSize, leaderId } = params;

    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: hackathonSlug, isDeleted: false },
      select: {
        id: true,
        slug: true,
        name: true,
        ownerId: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        registrationDeadline: true,
        isFree: true,
        maxTeams: true,
        participantType: true,
        _count: { select: { teams: true } },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    this.validateRegistrationOpen(hackathon);

    if (hackathon.ownerId === leaderId) {
      throw new BadRequestException('Hackathon owner cannot register');
    }

    const existingTeam = await prisma.teamEntity.findFirst({
      where: {
        hackathonId: hackathon.id,
        OR: [{ leaderId }, { members: { some: { userId: leaderId } } }],
      },
    });

    if (existingTeam) {
      throw new BadRequestException(
        'You are already in a team for this hackathon',
      );
    }

    if (hackathon.maxTeams && hackathon._count.teams >= hackathon.maxTeams) {
      throw new BadRequestException('Maximum teams limit reached');
    }

    const invitationCode = this.generateInvitationCode();

    // Determine max size from hackathon's participantType if not explicitly provided
    const effectiveMaxSize =
      maxSize ?? getMaxSizeFromParticipantType(hackathon.participantType);

    const team = await prisma.teamEntity.create({
      data: {
        name,
        maxSize: effectiveMaxSize,
        hackathonId: hackathon.id,
        leaderId,
        creatorId: leaderId,
        invitationCode,
        isOpen: true,
      },
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    this.logger.log(
      `Draft team created: ${team.id} for hackathon ${hackathon.slug} by ${leaderId}`,
    );

    this.emitHackathonJoinConfirmation({
      email: team.leader.email,
      userName: this.buildUserDisplayName(team.leader),
      hackathonName: hackathon.name,
      teamName: team.name,
    });

    return {
      team,
      hackathon: {
        id: hackathon.id,
        slug: hackathon.slug,
        name: hackathon.name,
      },
      invitationCode,
    };
  }

  async joinDraftTeam(params: {
    teamId?: string;
    invitationCode?: string;
    userId: string;
    /**
     * Optional referral attribution. Persisted on TeamMemberEntity.referralId
     * so the referrer dashboard can list this join. Callers resolve/validate
     * the code before passing it (see ReferralService.resolveForRegistration).
     */
    referralId?: string | null;
    /** Free ticket tier — skips payment check when joining a paid hackathon. */
    ticketTierId?: string;
  }) {
    const { teamId, invitationCode, userId, referralId, ticketTierId } = params;

    if (!teamId && !invitationCode) {
      throw new BadRequestException(
        'Either teamId or invitationCode is required',
      );
    }

    const team = await prisma.teamEntity.findFirst({
      where: teamId ? { id: teamId } : { invitationCode },
      include: {
        ticketTier: { select: { isFree: true, price: true } },
        hackathon: {
          select: {
            id: true,
            slug: true,
            name: true,
            ownerId: true,
            status: true,
            approvalStatus: true,
            isRegistrationPaused: true,
            registrationDeadline: true,
            isFree: true,
            chargeMode: true,
          },
        },
        members: { select: { userId: true } },
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    this.validateRegistrationOpen(team.hackathon);

    if (team.hackathon.ownerId === userId) {
      throw new BadRequestException('Hackathon owner cannot join teams');
    }

    if (team.leaderId === userId) {
      throw new BadRequestException('You are already the leader of this team');
    }

    if (team.members.some((m) => m.userId === userId)) {
      throw new BadRequestException('You are already a member of this team');
    }

    const existingTeam = await prisma.teamEntity.findFirst({
      where: {
        hackathonId: team.hackathonId,
        OR: [{ leaderId: userId }, { members: { some: { userId } } }],
        id: { not: team.id },
      },
    });

    if (existingTeam) {
      throw new BadRequestException(
        'You are already in another team for this hackathon',
      );
    }

    const currentSize = team.members.length + 1;
    if (currentSize >= team.maxSize) {
      throw new BadRequestException('Team is full');
    }

    if (!team.isOpen) {
      throw new BadRequestException('Team is not accepting new members');
    }

    let joinFreeTierId: string | null = null;
    if (ticketTierId && !team.hackathon.isFree) {
      const tier = await prisma.ticketTierEntity.findFirst({
        where: {
          id: ticketTierId,
          hackathonId: team.hackathon.id,
          isActive: true,
        },
        select: { id: true, isFree: true, price: true },
      });
      if (!tier) {
        throw new BadRequestException(
          'Invalid or inactive ticket tier selected',
        );
      }
      const tierIsFree =
        tier.isFree || new Decimal(tier.price).lessThanOrEqualTo(0);
      if (!tierIsFree) {
        throw new BadRequestException(
          'This ticket requires payment. Complete checkout for paid tiers.',
        );
      }
      joinFreeTierId = tier.id;
    }

    const teamHasFreeTier =
      !!team.ticketTierId &&
      !!team.ticketTier &&
      (team.ticketTier.isFree ||
        new Decimal(team.ticketTier.price).lessThanOrEqualTo(0));

    // For paid hackathons, validate payment before allowing user to join
    if (!team.hackathon.isFree && !joinFreeTierId && !teamHasFreeTier) {
      if (team.hackathon.chargeMode === HackathonChargeMode.PER_TEAM) {
        // PER_TEAM: Members (not leader) must wait for leader to complete payment
        if (team.leaderId !== userId) {
          const teamPayment = await prisma.hackathonPaymentEntity.findFirst({
            where: {
              hackathonId: team.hackathon.id,
              teamId: team.id,
              scope: HackathonPaymentScope.TEAM,
              paymentStatus: {
                in: [
                  HackathonPaymentStatus.AUTHORIZED,
                  HackathonPaymentStatus.CAPTURED,
                ],
              },
            },
          });

          if (!teamPayment) {
            throw new BadRequestException(
              'Team payment must be completed by the leader before members can join',
            );
          }
        }
      } else if (team.hackathon.chargeMode === HackathonChargeMode.PER_USER) {
        // PER_USER: Every user (including members) must complete their own payment before joining
        const userPayment = await prisma.hackathonPaymentEntity.findFirst({
          where: {
            hackathonId: team.hackathon.id,
            payerUserId: userId,
            scope: HackathonPaymentScope.USER,
            paymentStatus: {
              in: [
                HackathonPaymentStatus.AUTHORIZED,
                HackathonPaymentStatus.CAPTURED,
              ],
            },
          },
        });

        if (!userPayment) {
          throw new BadRequestException(
            'You must complete payment before joining a team',
          );
        }
      }
    }

    const member = await prisma.teamMemberEntity.create({
      data: {
        teamId: team.id,
        userId,
        ...(joinFreeTierId ? { ticketTierId: joinFreeTierId } : {}),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    // Atomic attribution: only bump counter when we actually claim referralId on this row.
    if (referralId) {
      const attributed = await prisma.teamMemberEntity.updateMany({
        where: { id: member.id, referralId: null },
        data: { referralId },
      });
      if (attributed.count > 0) {
        try {
          await this.referralService.markRegistrationAttributed(referralId);
        } catch (err) {
          this.logger.warn(
            `Referral counter increment after draft join failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    this.logger.log(`User ${userId} joined draft team ${team.id}`);

    this.emitHackathonJoinConfirmation({
      email: member.user.email,
      userName: this.buildUserDisplayName(member.user),
      hackathonName: team.hackathon.name,
      teamName: team.name,
    });

    this.emitHackathonNewMemberJoined({
      leaderEmail: team.leader.email,
      teamLeaderName: this.buildUserDisplayName(team.leader),
      newMemberName: this.buildUserDisplayName(member.user),
      teamName: team.name,
      hackathonName: team.hackathon.name,
    });

    return {
      member,
      team: { id: team.id, name: team.name },
      hackathon: {
        id: team.hackathon.id,
        slug: team.hackathon.slug,
        name: team.hackathon.name,
      },
    };
  }

  /**
   * True if this user already has a successful PER_USER entry payment for the hackathon.
   * Used to skip charging again when joining a different team after leaving the first.
   */
  async userHasPerUserEntryFeePaid(
    hackathonSlug: string,
    userId: string,
  ): Promise<boolean> {
    const hackathon = await prisma.hackathonEntity.findFirst({
      where: { slug: hackathonSlug, isDeleted: false },
      select: { id: true, isFree: true, chargeMode: true },
    });
    if (!hackathon || hackathon.isFree) {
      return false;
    }
    if (hackathon.chargeMode !== HackathonChargeMode.PER_USER) {
      return false;
    }
    const userPayment = await prisma.hackathonPaymentEntity.findFirst({
      where: {
        hackathonId: hackathon.id,
        payerUserId: userId,
        scope: HackathonPaymentScope.USER,
        paymentStatus: {
          in: [
            HackathonPaymentStatus.AUTHORIZED,
            HackathonPaymentStatus.CAPTURED,
          ],
        },
      },
    });
    return !!userPayment;
  }

  async leaveDraftTeam(params: { teamId: string; userId: string }) {
    const { teamId, userId } = params;

    const team = await prisma.teamEntity.findUnique({
      where: { id: teamId },
      include: {
        members: { where: { userId } },
        hackathon: { select: { id: true, slug: true } },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.leaderId === userId) {
      throw new BadRequestException(
        'Team leader cannot leave. Delete the team instead.',
      );
    }

    const membership = team.members[0];
    if (!membership) {
      throw new BadRequestException('You are not a member of this team');
    }

    await prisma.teamMemberEntity.delete({
      where: { id: membership.id },
    });

    this.logger.log(`User ${userId} left draft team ${teamId}`);

    return { success: true };
  }

  async getDraftTeam(params: { teamId: string; userId: string }) {
    const team = await prisma.teamEntity.findUnique({
      where: { id: params.teamId },
      include: {
        leader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            imageUrl: true,
          },
        },
        members: {
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
          },
        },
        hackathon: {
          select: {
            id: true,
            slug: true,
            name: true,
            isFree: true,
            entryFeeAmount: true,
            chargeMode: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const isLeader = team.leaderId === params.userId;
    const isMember = team.members.some((m) => m.userId === params.userId);

    if (!isLeader && !isMember) {
      throw new ForbiddenException('You are not a member of this team');
    }

    return team;
  }

  async getMyDraftTeam(params: { hackathonSlug: string; userId: string }) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: params.hackathonSlug, isDeleted: false },
      select: { id: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const team = await prisma.teamEntity.findFirst({
      where: {
        hackathonId: hackathon.id,
        OR: [
          { leaderId: params.userId },
          { members: { some: { userId: params.userId } } },
        ],
      },
      include: {
        leader: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        hackathon: {
          select: {
            id: true,
            slug: true,
            name: true,
            isFree: true,
            entryFeeAmount: true,
            chargeMode: true,
          },
        },
      },
    });

    return team;
  }

  private validateRegistrationOpen(hackathon: {
    status: LifecycleStatus;
    approvalStatus: ApprovalStatus;
    isRegistrationPaused: boolean;
    registrationDeadline: Date | null;
  }) {
    if (
      hackathon.status !== LifecycleStatus.PUBLISHED &&
      hackathon.status !== LifecycleStatus.ONGOING
    ) {
      throw new BadRequestException('Hackathon is not open for registration');
    }

    if (hackathon.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('Hackathon is not approved');
    }

    if (hackathon.isRegistrationPaused) {
      throw new BadRequestException('Registration is paused');
    }

    if (
      hackathon.registrationDeadline &&
      new Date() > hackathon.registrationDeadline
    ) {
      throw new BadRequestException('Registration deadline has passed');
    }
  }

  private generateInvitationCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
