import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  prisma,
  HackathonPaymentStatus,
  HackathonPaymentScope,
  HackathonChargeMode,
  LifecycleStatus,
  ApprovalStatus,
} from '@oppskills/db';
import { extractMobileFromRegistrationFieldAnswers } from '../_utils/extract-mobile-from-registration-field-answers';
import { syncUserOnboardingMobileFromRegistration } from '../_utils/sync-user-onboarding-mobile';

const SUCCESSFUL_PAYMENT_STATUSES: HackathonPaymentStatus[] = [
  HackathonPaymentStatus.CAPTURED,
  HackathonPaymentStatus.AUTHORIZED,
];

interface SubmitRegistrationParams {
  hackathonSlug: string;
  userId: string;
  answers?: Array<{ fieldId: string; value: string }>;
}

@Injectable()
export class RegistrationSubmitService {
  private readonly logger = new Logger(RegistrationSubmitService.name);
  async submitRegistration(params: SubmitRegistrationParams) {
    const { hackathonSlug, userId, answers = [] } = params;

    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: hackathonSlug, isDeleted: false },
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

    // Map frontend field IDs (like "default-name") to database field IDs
    const { mappedAnswers, userCategory } =
      await this.mapFieldIdsToDatabaseIds(hackathon.id, userId, answers);

    // Refetch registration form fields after mapping (in case new fields were created)
    const updatedRegForm = await prisma.registrationFormEntity.findUnique({
      where: { hackathonId: hackathon.id },
      include: {
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
    });

    this.validateAnswers(
      updatedRegForm?.fields || [],
      mappedAnswers,
      userCategory,
    );

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

      if (mappedAnswers.length === 0) {
        const formFieldCount = hackathon.registrationForm?.fields?.length ?? 0;
        if (formFieldCount > 0) {
          this.logger.warn(
            `submitRegistration: submission for hackathon ${hackathon.id} / user ${userId} has 0 answers but form has ${formFieldCount} field(s)`,
          );
        }
      }

      if (mappedAnswers.length > 0) {
        const answerData = mappedAnswers.map((a) => ({
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

      await tx.hackathonEntity.update({
        where: { id: hackathon.id },
        data: { registrationCount: { increment: 1 } },
      });

      return submission;
    });

    const mobile = extractMobileFromRegistrationFieldAnswers(
      mappedAnswers,
      updatedRegForm?.fields ?? [],
    );
    await syncUserOnboardingMobileFromRegistration(userId, mobile);

    return {
      success: true,
      submissionId: result.id,
      hackathonName: hackathon.name,
      teamName: leaderTeam.name,
    };
  }

  /**
   * After successful payment, persist registration answers when team create/join left a
   * shell submission (0 answer rows). If no submission exists, delegates to
   * {@link submitRegistration}. Idempotent when answers are already saved.
   */
  async ensureRegistrationAnswersAfterPayment(params: {
    hackathonSlug: string;
    userId: string;
    answers: Array<{ fieldId: string; value: string }>;
  }): Promise<void> {
    const { hackathonSlug, userId, answers } = params;
    if (!answers.length) {
      return;
    }

    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: hackathonSlug, isDeleted: false },
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
            externalFormLink: true,
            fields: { select: { id: true } },
          },
        },
      },
    });

    if (!hackathon) {
      throw new NotFoundException('Hackathon not found');
    }

    this.validateRegistrationOpen(hackathon);

    if (hackathon.registrationForm?.externalFormLink?.trim()) {
      return;
    }

    const membership = await prisma.teamMemberEntity.findFirst({
      where: {
        userId,
        team: { hackathonId: hackathon.id },
      },
      include: {
        team: true,
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

    const existingShell =
      await prisma.hackathonRegistrationSubmissionEntity.findFirst({
        where: {
          hackathonId: hackathon.id,
          userId,
          teamId: leaderTeam.id,
        },
        select: {
          id: true,
          _count: { select: { answers: true } },
        },
      });

    if (!existingShell) {
      await this.submitRegistration({ hackathonSlug, userId, answers });
      return;
    }

    if (existingShell._count.answers > 0) {
      return;
    }

    if (!hackathon.isFree) {
      await this.validatePaymentRequirement(hackathon, leaderTeam, userId);
    }

    const { mappedAnswers, userCategory } =
      await this.mapFieldIdsToDatabaseIds(hackathon.id, userId, answers);

    const updatedRegForm = await prisma.registrationFormEntity.findUnique({
      where: { hackathonId: hackathon.id },
      include: {
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
    });

    this.validateAnswers(
      updatedRegForm?.fields || [],
      mappedAnswers,
      userCategory,
    );

    if (mappedAnswers.length === 0) {
      return;
    }

    await prisma.hackathonRegistrationAnswerEntity.createMany({
      data: mappedAnswers.map((a) => ({
        submissionId: existingShell.id,
        fieldId: a.fieldId,
        valueText:
          typeof a.value === 'string' ? a.value : JSON.stringify(a.value),
        valueJson: a.value,
      })),
    });

    const mobile = extractMobileFromRegistrationFieldAnswers(
      mappedAnswers,
      updatedRegForm?.fields ?? [],
    );
    await syncUserOnboardingMobileFromRegistration(userId, mobile);

    this.logger.log(
      `Appended ${mappedAnswers.length} registration answers to shell submission ${existingShell.id} for user ${userId} hackathon ${hackathonSlug}`,
    );
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
          'Team payment must be completed before submitting registration',
        );
      }
    } else {
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

      if (!userPayment) {
        throw new BadRequestException(
          'You must complete payment before submitting registration',
        );
      }
    }
  }

  /**
   * Maps frontend field IDs (like "default-name") to database field IDs.
   * Creates default fields if they don't exist.
   */
  private async mapFieldIdsToDatabaseIds(
    hackathonId: string,
    userId: string,
    answers: Array<{ fieldId: string; value: string }>,
  ): Promise<{
    mappedAnswers: Array<{ fieldId: string; value: string }>;
    userCategory: string | null;
  }> {
    const regForm = await prisma.registrationFormEntity.findUnique({
      where: { hackathonId },
      include: {
        fields: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (regForm?.externalFormLink) {
      const p = await prisma.userOnboardingProfileEntity.findUnique({
        where: { userId },
        select: { userCategory: true },
      });
      return {
        mappedAnswers: answers,
        userCategory: p?.userCategory ?? null,
      };
    }

    const userOnboardingProfile =
      await prisma.userOnboardingProfileEntity.findUnique({
        where: { userId },
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
      },
      {
        frontendId: 'default-school-class',
        label: 'School Class',
        type: 'TEXT',
        order: -9,
        required: false,
        options: [],
      },
      {
        frontendId: 'default-college-name',
        label: 'College Name',
        type: 'TEXT',
        order: -8,
        required: false,
        options: [],
      },
      {
        frontendId: 'default-company-name',
        label: 'Company Name',
        type: 'TEXT',
        order: -7,
        required: false,
        options: [],
      },
    ];

    // Upsert registration form if missing
    const ensuredRegForm =
      regForm ??
      (await prisma.registrationFormEntity.create({
        data: { hackathonId },
        include: {
          fields: {
            orderBy: { order: 'asc' },
          },
        },
      }));

    const existingFieldsByLabel = new Map<string, any>(
      ensuredRegForm.fields.map((f) => [f.label.toLowerCase(), f]),
    );

    const usedOrders = new Set(ensuredRegForm.fields.map((f) => f.order));

    const frontendIdToDbId = new Map<string, string>();

    // Map default fields
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

    // Map existing fields (non-default fields use their own IDs)
    for (const existingField of ensuredRegForm.fields) {
      frontendIdToDbId.set(existingField.id, existingField.id);
    }

    // Map answers from frontend IDs to database IDs
    const mappedAnswers = answers.map((a) => ({
      fieldId: frontendIdToDbId.get(a.fieldId) ?? a.fieldId,
      value: a.value,
    }));

    return {
      mappedAnswers,
      userCategory: userCategory ?? null,
    };
  }

  /**
   * Identity fields: only those matching the user's category are enforced as required
   * (aligned with team.service validateRegistrationAnswers).
   */
  private validateAnswers(
    fields: Array<{ id: string; label: string; required: boolean }>,
    answers: Array<{ fieldId: string; value: string }>,
    userCategory: string | null | undefined,
  ) {
    const answerMap = new Map(answers.map((a) => [a.fieldId, a.value]));

    const identityFieldLabels = new Set([
      'school name',
      'school class',
      'college name',
      'company name',
    ]);

    const effectiveCategory = userCategory ?? 'COLLEGE_STUDENT';

    const identityLabelsForUser = ((): Set<string> => {
      if (effectiveCategory === 'SCHOOL_STUDENT') {
        return new Set(['school name', 'school class']);
      }
      if (effectiveCategory === 'WORKING_PROFESSIONAL') {
        return new Set(['company name']);
      }
      return new Set(['college name']);
    })();

    for (const field of fields) {
      if (!field.required) continue;

      const fieldLabelLower = field.label.toLowerCase();

      if (
        identityFieldLabels.has(fieldLabelLower) &&
        !identityLabelsForUser.has(fieldLabelLower)
      ) {
        continue;
      }

      const answer = answerMap.get(field.id);
      if (!answer || answer.trim() === '') {
        throw new BadRequestException(
          `Required field "${field.label}" is missing`,
        );
      }
    }
  }

  /**
   * Whether the user has a successful payment for this hackathon (leader/payer context).
   */
  private async hasSuccessfulHackathonPayment(
    hackathon: {
      id: string;
      isFree: boolean;
      chargeMode: HackathonChargeMode;
    },
    userId: string,
    teamId: string | null,
  ): Promise<boolean> {
    if (hackathon.isFree) {
      return true;
    }
    if (hackathon.chargeMode === HackathonChargeMode.PER_USER) {
      const p = await prisma.hackathonPaymentEntity.findFirst({
        where: {
          hackathonId: hackathon.id,
          payerUserId: userId,
          scope: HackathonPaymentScope.USER,
          paymentStatus: { in: SUCCESSFUL_PAYMENT_STATUSES },
        },
      });
      return !!p;
    }
    if (teamId) {
      const p = await prisma.hackathonPaymentEntity.findFirst({
        where: {
          hackathonId: hackathon.id,
          teamId,
          scope: HackathonPaymentScope.TEAM,
          paymentStatus: { in: SUCCESSFUL_PAYMENT_STATUSES },
        },
      });
      return !!p;
    }
    const p = await prisma.hackathonPaymentEntity.findFirst({
      where: {
        hackathonId: hackathon.id,
        payerUserId: userId,
        scope: HackathonPaymentScope.TEAM,
        paymentStatus: { in: SUCCESSFUL_PAYMENT_STATUSES },
      },
    });
    return !!p;
  }

  async getRegistrationStatus(hackathonSlug: string, userId: string) {
    const hackathon = await prisma.hackathonEntity.findUnique({
      where: { slug: hackathonSlug, isDeleted: false },
      select: {
        id: true,
        isFree: true,
        chargeMode: true,
        registrationForm: {
          select: {
            externalFormLink: true,
            fields: { select: { id: true } },
          },
        },
      },
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
      },
    });

    const leaderTeam =
      membership?.team ??
      (await prisma.teamEntity.findFirst({
        where: { hackathonId: hackathon.id, leaderId: userId },
        select: { id: true, name: true, leaderId: true },
      }));

    if (!leaderTeam) {
      const paymentCompleted = await this.hasSuccessfulHackathonPayment(
        hackathon,
        userId,
        null,
      );
      const isPaidButIncomplete = !hackathon.isFree && paymentCompleted;
      return {
        hasTeam: false,
        teamId: null,
        teamName: null,
        isLeader: false,
        hasSubmitted: false,
        hasRegistrationRecord: false,
        submissionId: null,
        paymentStatus: null,
        paymentCompleted,
        isPaidButIncomplete,
        /** Paid but no team yet — open modal to create team + form without charging again. */
        canCompleteRegistrationWithoutPayment: isPaidButIncomplete,
        isRegistrationIncomplete: true,
      };
    }

    const submissionRow =
      await prisma.hackathonRegistrationSubmissionEntity.findFirst({
        where: {
          hackathonId: hackathon.id,
          userId,
          teamId: leaderTeam.id,
        },
        select: {
          id: true,
          _count: { select: { answers: true } },
        },
      });

    const regForm = hackathon.registrationForm;
    const hasRegistrationRecord = !!submissionRow;
    const hasSubmitted = RegistrationSubmitService.computeMaterialHasSubmitted(
      submissionRow,
      regForm,
    );

    let paymentStatus: string | null = null;

    if (!hackathon.isFree) {
      if (hackathon.chargeMode === HackathonChargeMode.PER_TEAM) {
        const payment = await prisma.hackathonPaymentEntity.findFirst({
          where: {
            hackathonId: hackathon.id,
            teamId: leaderTeam.id,
            scope: HackathonPaymentScope.TEAM,
          },
          orderBy: { createdAt: 'desc' },
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
          orderBy: { createdAt: 'desc' },
          select: { paymentStatus: true },
        });
        paymentStatus = payment?.paymentStatus || 'NOT_PAID';
      }
    }

    const paymentCompleted = await this.hasSuccessfulHackathonPayment(
      hackathon,
      userId,
      leaderTeam.id,
    );
    const isPaidButIncomplete =
      !hackathon.isFree && paymentCompleted && !hasSubmitted;
    const canCompleteRegistrationWithoutPayment =
      !hasSubmitted &&
      (paymentCompleted || (hackathon.isFree && !!leaderTeam));

    return {
      hasTeam: true,
      teamId: leaderTeam.id,
      teamName: leaderTeam.name,
      isLeader: leaderTeam.leaderId === userId,
      hasSubmitted,
      hasRegistrationRecord,
      submissionId: submissionRow?.id || null,
      paymentStatus,
      paymentCompleted,
      isPaidButIncomplete,
      canCompleteRegistrationWithoutPayment,
      isRegistrationIncomplete: !hasSubmitted,
    };
  }

  /**
   * "Submitted" for UX: external-form hackathons need only a submission row;
   * internal forms need at least one saved answer when the form defines fields.
   */
  private static computeMaterialHasSubmitted(
    submissionRow: { _count: { answers: number } } | null,
    regForm:
      | {
          externalFormLink: string | null;
          fields: { id: string }[];
        }
      | null
      | undefined,
  ): boolean {
    if (!submissionRow) {
      return false;
    }
    if (regForm?.externalFormLink?.trim()) {
      return true;
    }
    const fieldCount = regForm?.fields?.length ?? 0;
    if (fieldCount === 0) {
      return true;
    }
    return submissionRow._count.answers > 0;
  }
}
