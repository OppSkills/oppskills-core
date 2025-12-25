import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { prisma } from '@oppskills/db';
import type { CreateTeamDto, JoinTeamDto } from '@oppskills/types';
import { randomBytes } from 'crypto';

/**
 * Generate a unique invitation code.
 */
function generateInvitationCode(): string {
  return randomBytes(4).toString('hex').toUpperCase();
}

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
    default:
      return 4;
  }
}

@Injectable()
export class TeamService {
  /**
   * Create a team for a hackathon.
   * - Verifies hackathon exists and is open for registration.
   * - Enforces maxTeams limit if configured on the hackathon.
   * - Hackathon owner cannot create a team in their own hackathon.
   * - Generates a unique invitation code for the team.
   * - Creates registration submission with answers for the leader.
   */
  async createTeam(dto: CreateTeamDto, leaderId: string) {
    // Verify hackathon exists and get settings
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { id: dto.hackathonId },
      select: {
        id: true,
        ownerId: true,
        maxTeams: true,
        participantType: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        registrationDeadline: true,
        registrationForm: {
          include: {
            fields: {
              orderBy: { order: 'asc' },
            },
          },
        },
        _count: {
          select: {
            teams: true,
          },
        },
      },
    });
    if (!hackathon) throw new NotFoundException('Hackathon not found');

    // Check registration is open
    if (hackathon.status !== 'PUBLISHED' && hackathon.status !== 'ONGOING') {
      throw new BadRequestException(
        'Hackathon is not accepting registrations.',
      );
    }

    if (hackathon.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Hackathon has not been approved yet.');
    }

    if (hackathon.isRegistrationPaused) {
      throw new BadRequestException('Registrations are currently paused.');
    }

    if (
      hackathon.registrationDeadline &&
      new Date() > hackathon.registrationDeadline
    ) {
      throw new BadRequestException('Registration deadline has passed.');
    }

    // Hackathon owner cannot create a team in their own hackathon
    if (hackathon.ownerId === leaderId) {
      throw new ForbiddenException(
        'Hackathon owner cannot create a team in their own hackathon',
      );
    }

    // Check if user is already in a team for this hackathon
    const existingTeam = await this.checkUserTeamInHackathon(
      dto.hackathonId,
      leaderId,
    );
    if (existingTeam) {
      throw new ForbiddenException(
        'You are already registered in a team for this hackathon.',
      );
    }

    // Enforce maxTeams limit if configured (null = unlimited)
    if (hackathon.maxTeams !== null) {
      const currentTeamCount = hackathon._count.teams;
      if (currentTeamCount >= hackathon.maxTeams) {
        throw new ForbiddenException(
          `Maximum number of teams (${hackathon.maxTeams}) has been reached for this hackathon.`,
        );
      }
    }

    // Determine max size from participantType if not provided
    const maxSize =
      dto.maxSize ?? getMaxSizeFromParticipantType(hackathon.participantType);

    const { providedAnswers } = await this.prepareHackathonRegistrationAnswers({
      hackathonId: dto.hackathonId,
      userId: leaderId,
      answers: dto.answers,
    });

    // Generate unique invitation code
    let invitationCode = generateInvitationCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.teamEntity.findUnique({
        where: { invitationCode },
      });
      if (!existing) break;
      invitationCode = generateInvitationCode();
      attempts++;
    }

    // Create team and registration in transaction
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.teamEntity.create({
        data: {
          name: dto.name,
          maxSize,
          hackathonId: dto.hackathonId,
          leaderId,
          creatorId: leaderId,
          invitationCode,
          isOpen: dto.isOpen ?? true,
        },
        include: {
          leader: true,
          hackathon: true,
        },
      });

      // Create registration submission for leader (even if no answers)
      const submission = await tx.hackathonRegistrationSubmissionEntity.create({
        data: {
          hackathonId: dto.hackathonId,
          userId: leaderId,
          teamId: team.id,
          isLeader: true,
        },
      });

      if (providedAnswers.length > 0) {
        const answerData = providedAnswers.map((a) => ({
          submissionId: submission.id,
          fieldId: a.fieldId,
          valueText:
            typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
          valueJson: a.value,
        }));

        await tx.hackathonRegistrationAnswerEntity.createMany({
          data: answerData,
        });
      }

      // Increment registration count
      await tx.hackathonEntity.update({
        where: { id: dto.hackathonId },
        data: { registrationCount: { increment: 1 } },
      });

      return team;
    });

    return result;
  }

  /**
   * Get open teams for a hackathon that users can browse and join.
   */
  async getTeamsByHackathon(hackathonId: string) {
    return prisma.teamEntity.findMany({
      where: {
        hackathonId,
        isOpen: true,
      },
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getTeamById(teamId: string) {
    const team = await prisma.teamEntity.findUnique({
      where: { id: teamId },
      include: {
        hackathon: true,
        leader: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  /**
   * Join a team by ID or invitation code.
   */
  async joinTeam(dto: JoinTeamDto, userId: string) {
    // Find team by ID or invitation code
    let team;
    if (dto.teamId) {
      team = await prisma.teamEntity.findUnique({
        where: { id: dto.teamId },
        include: {
          members: true,
          hackathon: {
            select: {
              id: true,
              ownerId: true,
              status: true,
              approvalStatus: true,
              isRegistrationPaused: true,
              registrationDeadline: true,
              registrationForm: {
                include: {
                  fields: { orderBy: { order: 'asc' } },
                },
              },
            },
          },
        },
      });
    } else if (dto.invitationCode) {
      team = await prisma.teamEntity.findUnique({
        where: { invitationCode: dto.invitationCode },
        include: {
          members: true,
          hackathon: {
            select: {
              id: true,
              ownerId: true,
              status: true,
              approvalStatus: true,
              isRegistrationPaused: true,
              registrationDeadline: true,
              registrationForm: {
                include: {
                  fields: { orderBy: { order: 'asc' } },
                },
              },
            },
          },
        },
      });
    } else {
      throw new BadRequestException(
        'Either teamId or invitationCode is required.',
      );
    }

    if (!team) throw new NotFoundException('Team not found');

    const hackathon = team.hackathon;

    // Check registration is open
    if (hackathon.status !== 'PUBLISHED' && hackathon.status !== 'ONGOING') {
      throw new BadRequestException(
        'Hackathon is not accepting registrations.',
      );
    }

    if (hackathon.approvalStatus !== 'APPROVED') {
      throw new BadRequestException('Hackathon has not been approved yet.');
    }

    if (hackathon.isRegistrationPaused) {
      throw new BadRequestException('Registrations are currently paused.');
    }

    if (
      hackathon.registrationDeadline &&
      new Date() > hackathon.registrationDeadline
    ) {
      throw new BadRequestException('Registration deadline has passed.');
    }

    // Check if team is full
    // +1 for leader who is not in members table
    const currentSize = team.members.length + 1;
    if (currentSize >= team.maxSize)
      throw new ForbiddenException('Team is already full');

    if (team.leaderId === userId)
      throw new ForbiddenException('Team leader cannot join their own team');

    // Prevent joining twice
    const alreadyMember = team.members.some((m) => m.userId === userId);
    if (alreadyMember)
      throw new ForbiddenException('User already part of this team');

    // Check if user is in another team for this hackathon
    const existingTeam = await this.checkUserTeamInHackathon(
      team.hackathonId,
      userId,
    );
    if (existingTeam) {
      throw new ForbiddenException(
        'You are already registered in a team for this hackathon.',
      );
    }

    const { providedAnswers } = await this.prepareHackathonRegistrationAnswers({
      hackathonId: team.hackathonId,
      userId,
      answers: dto.answers,
    });

    // Create member and registration in transaction
    const result = await prisma.$transaction(async (tx) => {
      const newMember = await tx.teamMemberEntity.create({
        data: { userId, teamId: team.id },
      });

      // Create registration submission for member (even if no answers)
      const submission = await tx.hackathonRegistrationSubmissionEntity.create({
        data: {
          hackathonId: team.hackathonId,
          userId,
          teamId: team.id,
          teamMemberId: newMember.id,
          isLeader: false,
        },
      });

      if (providedAnswers.length > 0) {
        const answerData = providedAnswers.map((a) => ({
          submissionId: submission.id,
          fieldId: a.fieldId,
          valueText:
            typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
          valueJson: a.value,
        }));

        await tx.hackathonRegistrationAnswerEntity.createMany({
          data: answerData,
        });
      }

      // Increment registration count
      await tx.hackathonEntity.update({
        where: { id: team.hackathonId },
        data: { registrationCount: { increment: 1 } },
      });

      return newMember;
    });

    return result;
  }

  async leaveTeam(teamId: string, userId: string) {
    const member = await prisma.teamMemberEntity.findFirst({
      where: { teamId, userId },
    });

    if (!member) throw new NotFoundException('Not part of this team');

    await prisma.$transaction(async (tx) => {
      // Delete registration submission
      await tx.hackathonRegistrationSubmissionEntity.deleteMany({
        where: { teamMemberId: member.id },
      });

      // Delete team member
      await tx.teamMemberEntity.delete({ where: { id: member.id } });

      // Get hackathonId from team
      const team = await tx.teamEntity.findUnique({
        where: { id: teamId },
        select: { hackathonId: true },
      });

      if (team) {
        // Decrement registration count
        await tx.hackathonEntity.update({
          where: { id: team.hackathonId },
          data: { registrationCount: { decrement: 1 } },
        });
      }
    });

    return { message: 'Left team successfully' };
  }

  /**
   * Check if user is already in a team for a hackathon.
   * Returns the team if found, null otherwise.
   */
  async checkUserTeamInHackathon(hackathonId: string, userId: string) {
    // Check if user is a leader of any team
    const leaderTeam = await prisma.teamEntity.findFirst({
      where: {
        hackathonId,
        leaderId: userId,
      },
      include: {
        leader: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            imageUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
          },
        },
        hackathon: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (leaderTeam) return leaderTeam;

    // Check if user is a member of any team
    const memberRecord = await prisma.teamMemberEntity.findFirst({
      where: {
        userId,
        team: {
          hackathonId,
        },
      },
      include: {
        team: {
          include: {
            leader: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                imageUrl: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    imageUrl: true,
                  },
                },
              },
            },
            hackathon: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    return memberRecord?.team ?? null;
  }

  /**
   * Change the team leader.
   * Only the original team creator can change the leader.
   * New leader must be an existing team member.
   */
  async changeTeamLeader(
    teamId: string,
    newLeaderId: string,
    currentUserId: string,
  ) {
    const team = await prisma.teamEntity.findUnique({
      where: { id: teamId },
      include: { members: true },
    });

    if (!team) throw new NotFoundException('Team not found');

    // Only the original team creator can change the leader
    if (team.creatorId !== currentUserId) {
      throw new ForbiddenException(
        'Only the team creator can change the leader',
      );
    }

    // Can't set the current leader as new leader
    if (newLeaderId === team.leaderId) {
      throw new ForbiddenException('You are already the team leader');
    }

    // New leader must be an existing team member
    const isMember = team.members.some((m) => m.userId === newLeaderId);
    if (!isMember) {
      throw new ForbiddenException(
        'New leader must be an existing team member',
      );
    }

    // Capture old leader before update
    const oldLeaderId = team.leaderId;

    // Update in a transaction:
    // 1. Set new leader
    // 2. Remove new leader from members (since leader is separate)
    // 3. Add old leader to members
    // 4. Update registration submission isLeader flags
    await prisma.$transaction(async (tx) => {
      // Update leader
      await tx.teamEntity.update({
        where: { id: teamId },
        data: { leaderId: newLeaderId },
      });

      // Remove new leader from members table
      await tx.teamMemberEntity.deleteMany({
        where: { teamId, userId: newLeaderId },
      });

      // Add old leader as a member (if not already a member)
      const oldLeaderIsMember = team.members.some(
        (m) => m.userId === oldLeaderId,
      );
      if (!oldLeaderIsMember) {
        await tx.teamMemberEntity.create({
          data: { teamId, userId: oldLeaderId },
        });
      }

      // Update isLeader flags in registration submissions
      await tx.hackathonRegistrationSubmissionEntity.updateMany({
        where: { teamId, userId: oldLeaderId },
        data: { isLeader: false },
      });

      await tx.hackathonRegistrationSubmissionEntity.updateMany({
        where: { teamId, userId: newLeaderId },
        data: { isLeader: true },
      });
    });

    return { message: 'Team leader changed successfully' };
  }

  private async prepareHackathonRegistrationAnswers(input: {
    hackathonId: string;
    userId: string;
    answers?: Array<{ fieldId: string; value: string | number | string[] }>;
  }): Promise<{
    providedAnswers: Array<{
      fieldId: string;
      value: string | number | string[];
    }>;
  }> {
    const rawAnswers = input.answers ?? [];

    const regForm = await prisma.registrationFormEntity.findUnique({
      where: { hackathonId: input.hackathonId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (regForm?.externalFormLink) {
      if (rawAnswers.length > 0) {
        throw new BadRequestException(
          'This hackathon uses an external registration form and does not accept internal answers.',
        );
      }

      return { providedAnswers: [] };
    }

    const userOnboardingProfile =
      await prisma.userOnboardingProfileEntity.findUnique({
        where: { userId: input.userId },
        select: { userCategory: true },
      });

    const userCategory = userOnboardingProfile?.userCategory;

    const DEFAULT_GENDER_OPTIONS = [
      'MALE',
      'FEMALE',
      'OTHER',
      'PREFER_NOT_TO_SAY',
    ];

    type DefaultFieldDef = {
      label: string;
      type: 'TEXT' | 'EMAIL' | 'PHONE_NO' | 'OPTIONS';
      order: number;
      required: boolean;
      options: string[];
      frontendId: string;
      isIdentityField?: boolean;
    };

    const baseDefaultFieldDefs: DefaultFieldDef[] = [
      {
        frontendId: 'default-name',
        label: 'Name',
        type: 'TEXT',
        order: -50,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-email',
        label: 'Email',
        type: 'EMAIL',
        order: -40,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-phone',
        label: 'Phone No.',
        type: 'PHONE_NO',
        order: -30,
        required: true,
        options: [],
      },
      {
        frontendId: 'default-gender',
        label: 'Gender',
        type: 'OPTIONS',
        order: -20,
        required: true,
        options: DEFAULT_GENDER_OPTIONS,
      },
      {
        frontendId: 'default-school-name',
        label: 'School Name',
        type: 'TEXT',
        order: -10,
        required: false,
        options: [],
        isIdentityField: true,
      },
      {
        frontendId: 'default-college-name',
        label: 'College Name',
        type: 'TEXT',
        order: -9,
        required: false,
        options: [],
        isIdentityField: true,
      },
      {
        frontendId: 'default-company-name',
        label: 'Company Name',
        type: 'TEXT',
        order: -8,
        required: false,
        options: [],
        isIdentityField: true,
      },
    ];

    const requiredIdentityLabel =
      userCategory === 'SCHOOL_STUDENT'
        ? 'School Name'
        : userCategory === 'WORKING_PROFESSIONAL'
          ? 'Company Name'
          : 'College Name';

    // Upsert registration form if missing
    const ensuredRegForm =
      regForm ??
      (await prisma.registrationFormEntity.create({
        data: { hackathonId: input.hackathonId },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
        },
      }));

    const existingFieldsByLabel = new Map(
      ensuredRegForm.fields.map((f) => [f.label.toLowerCase(), f]),
    );

    const usedOrders = new Set(ensuredRegForm.fields.map((f) => f.order));

    const frontendIdToDbId = new Map<string, string>();

    for (const def of baseDefaultFieldDefs) {
      const existingField = existingFieldsByLabel.get(def.label.toLowerCase());

      if (existingField) {
        frontendIdToDbId.set(def.frontendId, existingField.id);

        const updateData: Record<string, unknown> = {};

        if (existingField.required !== def.required) {
          updateData.required = def.required;
        }

        if (
          def.label.toLowerCase() === 'gender' &&
          existingField.type === 'OPTIONS' &&
          (!existingField.options || existingField.options.length === 0)
        ) {
          updateData.options = DEFAULT_GENDER_OPTIONS;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.registrationFieldEntity.update({
            where: { id: existingField.id },
            data: updateData,
          });
        }
      } else {
        let orderToUse = def.order;
        while (usedOrders.has(orderToUse)) {
          orderToUse -= 1;
        }
        usedOrders.add(orderToUse);

        const newField = await prisma.registrationFieldEntity.create({
          data: {
            registrationFormId: ensuredRegForm.id,
            label: def.label,
            type: def.type,
            required: def.required,
            order: orderToUse,
            options: def.options,
          },
        });

        frontendIdToDbId.set(def.frontendId, newField.id);
      }
    }

    for (const existingField of ensuredRegForm.fields) {
      frontendIdToDbId.set(existingField.id, existingField.id);
    }

    const updatedRegForm = await prisma.registrationFormEntity.findUnique({
      where: { hackathonId: input.hackathonId },
      include: {
        fields: {
          select: {
            id: true,
            label: true,
            type: true,
            required: true,
            options: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    const registrationFields = updatedRegForm?.fields ?? [];

    const providedAnswers = rawAnswers.map((a) => ({
      fieldId: frontendIdToDbId.get(a.fieldId) ?? a.fieldId,
      value: a.value,
    }));

    this.validateRegistrationAnswers(providedAnswers, registrationFields);

    const requiredIdentityField = registrationFields.find(
      (f) => f.label.toLowerCase() === requiredIdentityLabel.toLowerCase(),
    );

    if (!requiredIdentityField) {
      throw new BadRequestException(
        `Field "${requiredIdentityLabel}" is required.`,
      );
    }

    const identityAnswer = providedAnswers.find(
      (a) => a.fieldId === requiredIdentityField.id,
    );

    const identityValue = identityAnswer?.value;
    const identityIsEmpty =
      identityValue === '' ||
      identityValue === null ||
      identityValue === undefined ||
      (Array.isArray(identityValue) && identityValue.length === 0);

    if (identityIsEmpty) {
      throw new BadRequestException(
        `Field "${requiredIdentityLabel}" is required and cannot be empty.`,
      );
    }

    return { providedAnswers };
  }

  /**
   * Validate registration answers against form fields.
   */
  private validateRegistrationAnswers(
    answers: Array<{ fieldId: string; value: string | number | string[] }>,
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      options: string[];
    }>,
  ) {
    const fieldMap = new Map(fields.map((f) => [f.id, f]));
    const providedFieldIds = new Set(answers.map((a) => a.fieldId));

    // Check for required fields
    for (const field of fields) {
      if (field.required && !providedFieldIds.has(field.id)) {
        throw new BadRequestException(`Field "${field.label}" is required.`);
      }
    }

    // Validate each answer
    for (const answer of answers) {
      const field = fieldMap.get(answer.fieldId);
      if (!field) {
        throw new BadRequestException(`Unknown field ID: ${answer.fieldId}`);
      }

      // Type validation
      const value = answer.value;
      const isEmpty =
        value === '' ||
        value === null ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0);

      if (field.required && isEmpty) {
        throw new BadRequestException(
          `Field "${field.label}" is required and cannot be empty.`,
        );
      }

      if (isEmpty) continue;

      switch (field.type) {
        case 'TEXT':
        case 'PHONE_NO':
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${field.label}" must be a string.`,
            );
          }
          break;
        case 'EMAIL': {
          if (typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${field.label}" must be a string.`,
            );
          }
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            throw new BadRequestException(
              `Field "${field.label}" must be a valid email.`,
            );
          }
          break;
        }
        case 'NUMBER':
          if (typeof value !== 'number' && typeof value !== 'string') {
            throw new BadRequestException(
              `Field "${field.label}" must be a number.`,
            );
          }
          break;
        case 'OPTIONS':
          if (Array.isArray(value)) {
            for (const v of value) {
              if (!field.options.includes(v)) {
                throw new BadRequestException(
                  `Invalid option "${v}" for field "${field.label}".`,
                );
              }
            }
          } else if (typeof value === 'string') {
            if (value.length > 0 && !field.options.includes(value)) {
              throw new BadRequestException(
                `Invalid option "${value}" for field "${field.label}".`,
              );
            }
          }
          break;
        case 'ATTACHMENTS':
          throw new BadRequestException('Attachments are not supported yet.');
      }
    }
  }
}
