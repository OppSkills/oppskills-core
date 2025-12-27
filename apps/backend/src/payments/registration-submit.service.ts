import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  prisma,
  HackathonPaymentStatus,
  HackathonPaymentScope,
  HackathonChargeMode,
  LifecycleStatus,
  ApprovalStatus,
} from '@oppskills/db';

interface SubmitRegistrationParams {
  hackathonSlug: string;
  userId: string;
  answers?: Array<{ fieldId: string; value: string }>;
}

@Injectable()
export class RegistrationSubmitService {
  async submitRegistration(params: SubmitRegistrationParams) {
    const { hackathonSlug, userId, answers = [] } = params;

    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: hackathonSlug },
      select: {
        id: true,
        name: true,
        isFree: true,
        chargeMode: true,
        status: true,
        approvalStatus: true,
        isRegistrationPaused: true,
        registrationDeadline: true,
        ownerId: true,
        registrationForm: {
          select: {
            fields: {
              select: {
                id: true,
                label: true,
                type: true,
                required: true,
                options: true,
              },
            },
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    this.validateRegistrationOpen(hackathon);

    const membership = await prisma.teamMemberEntity.findFirst({
      where: {
        userId,
        team: { hackathonId: hackathon.id },
      },
      include: {
        team: true,
        registrationSubmission: true,
      },
    });

    const leaderTeam =
      membership?.team ??
      (await prisma.teamEntity.findFirst({
        where: { hackathonId: hackathon.id, leaderId: userId },
        select: { id: true, name: true, leaderId: true },
      }));

    if (!leaderTeam) {
      throw new BadRequestException(
        'You must join a team before submitting registration',
      );
    }

    const existingSubmission = membership?.registrationSubmission
      ? membership.registrationSubmission
      : await prisma.hackathonRegistrationSubmissionEntity.findFirst({
          where: { hackathonId: hackathon.id, userId, teamId: leaderTeam.id },
        });

    if (existingSubmission) {
      throw new BadRequestException(
        'You have already submitted your registration',
      );
    }

    if (!hackathon.isFree) {
      await this.validatePaymentRequirement(hackathon, leaderTeam, userId);
    }

    this.validateAnswers(hackathon.registrationForm?.fields || [], answers);

    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.hackathonRegistrationSubmissionEntity.create({
        data: {
          hackathonId: hackathon.id,
          userId,
          teamId: leaderTeam.id,
          teamMemberId: membership?.id ?? null,
          isLeader: leaderTeam.leaderId === userId,
          submittedAt: new Date(),
        },
      });

      if (answers.length > 0) {
        await tx.hackathonRegistrationAnswerEntity.createMany({
          data: answers.map((a) => ({
            submissionId: submission.id,
            fieldId: a.fieldId,
            value: a.value,
          })),
        });
      }

      await tx.hackathonEntity.update({
        where: { id: hackathon.id },
        data: { registrationCount: { increment: 1 } },
      });

      return submission;
    });

    return {
      success: true,
      submissionId: result.id,
      hackathonName: hackathon.name,
      teamName: leaderTeam.name,
    };
  }

  private validateRegistrationOpen(hackathon: {
    status: LifecycleStatus;
    approvalStatus: ApprovalStatus;
    isRegistrationPaused: boolean;
    registrationDeadline: Date | null;
    ownerId: string;
  }) {
    if (
      hackathon.status !== LifecycleStatus.PUBLISHED &&
      hackathon.status !== LifecycleStatus.ONGOING
    ) {
      throw new BadRequestException('Hackathon is not open for registration');
    }

    if (hackathon.approvalStatus !== ApprovalStatus.APPROVED) {
      throw new BadRequestException('Hackathon is not approved yet');
    }

    if (hackathon.isRegistrationPaused) {
      throw new BadRequestException('Registration is currently paused');
    }

    if (
      hackathon.registrationDeadline &&
      new Date() > hackathon.registrationDeadline
    ) {
      throw new BadRequestException('Registration deadline has passed');
    }
  }

  private async validatePaymentRequirement(
    hackathon: { id: string; chargeMode: HackathonChargeMode },
    team: { id: string },
    userId: string,
  ) {
    if (hackathon.chargeMode === HackathonChargeMode.PER_TEAM) {
      const teamPayment = await prisma.hackathonPaymentEntity.findFirst({
        where: {
          hackathonId: hackathon.id,
          teamId: team.id,
          scope: HackathonPaymentScope.TEAM,
          paymentStatus: HackathonPaymentStatus.CAPTURED,
        },
      });

      if (!teamPayment) {
        throw new BadRequestException(
          'Team payment must be completed before submitting registration',
        );
      }
    } else {
      const userPayment = await prisma.hackathonPaymentEntity.findFirst({
        where: {
          hackathonId: hackathon.id,
          payerUserId: userId,
          scope: HackathonPaymentScope.USER,
          paymentStatus: HackathonPaymentStatus.CAPTURED,
        },
      });

      if (!userPayment) {
        throw new BadRequestException(
          'You must complete payment before submitting registration',
        );
      }
    }
  }

  private validateAnswers(
    fields: Array<{ id: string; label: string; required: boolean }>,
    answers: Array<{ fieldId: string; value: string }>,
  ) {
    const answerMap = new Map(answers.map((a) => [a.fieldId, a.value]));

    for (const field of fields) {
      if (field.required) {
        const answer = answerMap.get(field.id);
        if (!answer || answer.trim() === '') {
          throw new BadRequestException(
            `Required field "${field.label}" is missing`,
          );
        }
      }
    }
  }

  async getRegistrationStatus(hackathonSlug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: hackathonSlug },
      select: { id: true, isFree: true, chargeMode: true },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    const membership = await prisma.teamMemberEntity.findFirst({
      where: {
        userId,
        team: { hackathonId: hackathon.id },
      },
      include: {
        team: true,
        registrationSubmission: true,
      },
    });

    const leaderTeam =
      membership?.team ??
      (await prisma.teamEntity.findFirst({
        where: { hackathonId: hackathon.id, leaderId: userId },
        select: { id: true, name: true, leaderId: true },
      }));

    if (!leaderTeam) {
      return {
        hasTeam: false,
        teamId: null,
        teamName: null,
        isLeader: false,
        hasSubmitted: false,
        submissionId: null,
        paymentStatus: null,
      };
    }

    const submission = membership?.registrationSubmission
      ? membership.registrationSubmission
      : await prisma.hackathonRegistrationSubmissionEntity.findFirst({
          where: {
            hackathonId: hackathon.id,
            userId,
            teamId: leaderTeam.id,
          },
          select: { id: true },
        });

    let paymentStatus: string | null = null;

    if (!hackathon.isFree) {
      if (hackathon.chargeMode === HackathonChargeMode.PER_TEAM) {
        const payment = await prisma.hackathonPaymentEntity.findFirst({
          where: {
            hackathonId: hackathon.id,
            teamId: leaderTeam.id,
            scope: HackathonPaymentScope.TEAM,
          },
          select: { paymentStatus: true },
        });
        paymentStatus = payment?.paymentStatus || 'NOT_PAID';
      } else {
        const payment = await prisma.hackathonPaymentEntity.findFirst({
          where: {
            hackathonId: hackathon.id,
            payerUserId: userId,
            scope: HackathonPaymentScope.USER,
          },
          select: { paymentStatus: true },
        });
        paymentStatus = payment?.paymentStatus || 'NOT_PAID';
      }
    }

    return {
      hasTeam: true,
      teamId: leaderTeam.id,
      teamName: leaderTeam.name,
      isLeader: leaderTeam.leaderId === userId,
      hasSubmitted: !!submission,
      submissionId: submission?.id || null,
      paymentStatus,
    };
  }
}
