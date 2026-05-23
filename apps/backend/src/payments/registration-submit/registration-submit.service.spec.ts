import { RegistrationSubmitService } from './registration-submit.service';
import {
  ApprovalStatus,
  HackathonChargeMode,
  LifecycleStatus,
} from '@prisma/client';

jest.mock('@oppskills/db', () => {
  const prismaClient = jest.requireActual('@prisma/client');
  return {
    ...prismaClient,
    prisma: {
      hackathonEntity: {
        findUnique: jest.fn(),
      },
      teamMemberEntity: {
        findFirst: jest.fn(),
      },
      teamEntity: {
        findFirst: jest.fn(),
      },
      hackathonRegistrationSubmissionEntity: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      hackathonRegistrationAnswerEntity: {
        createMany: jest.fn(),
      },
      registrationFormEntity: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      registrationFieldEntity: {
        create: jest.fn(),
        update: jest.fn(),
      },
      userOnboardingProfileEntity: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      hackathonPaymentEntity: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(async (cb: (tx: unknown) => unknown) => cb({})),
    },
  };
});

import { prisma } from '@oppskills/db';

describe('RegistrationSubmitService', () => {
  let service: RegistrationSubmitService;
  const prismaMock = prisma as jest.Mocked<typeof prisma>;

  const openHackathonBase = {
    id: 'hack-1',
    name: 'Test Hack',
    isFree: false,
    chargeMode: HackathonChargeMode.PER_USER,
    status: LifecycleStatus.PUBLISHED,
    approvalStatus: ApprovalStatus.APPROVED,
    isRegistrationPaused: false,
    registrationDeadline: null,
    ownerId: 'owner-1',
    registrationForm: {
      externalFormLink: null as string | null,
      fields: [{ id: 'f-college' }],
    },
  };

  beforeEach(() => {
    service = new RegistrationSubmitService();
    jest.clearAllMocks();
  });

  describe('ensureRegistrationAnswersAfterPayment', () => {
    it('appends answers when submission exists with zero answer rows', async () => {
      jest.spyOn(service as any, 'mapFieldIdsToDatabaseIds').mockResolvedValue({
        mappedAnswers: [{ fieldId: 'field-college', value: 'MIT' }],
        userCategory: 'COLLEGE_STUDENT',
      });

      prismaMock.hackathonEntity.findUnique.mockResolvedValue({
        ...openHackathonBase,
      } as any);

      prismaMock.teamMemberEntity.findFirst.mockResolvedValue({
        team: {
          id: 'team-1',
          hackathonId: 'hack-1',
          leaderId: 'user-1',
          name: 'T',
        },
      } as any);

      prismaMock.hackathonRegistrationSubmissionEntity.findFirst.mockResolvedValue(
        {
          id: 'sub-shell',
          _count: { answers: 0 },
        } as any,
      );

      prismaMock.hackathonPaymentEntity.findFirst.mockResolvedValue({
        paymentStatus: 'CAPTURED',
      } as any);

      prismaMock.registrationFormEntity.findUnique.mockResolvedValue({
        fields: [
          {
            id: 'field-college',
            label: 'College Name',
            type: 'TEXT',
            required: true,
            options: [] as string[],
          },
        ],
      } as any);

      prismaMock.hackathonRegistrationAnswerEntity.createMany.mockResolvedValue(
        {
          count: 1,
        } as any,
      );

      await service.ensureRegistrationAnswersAfterPayment({
        hackathonSlug: 'test-hack',
        userId: 'user-1',
        answers: [{ fieldId: 'field-college', value: 'MIT' }],
      });

      expect(
        prismaMock.hackathonRegistrationAnswerEntity.createMany,
      ).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({
            submissionId: 'sub-shell',
            fieldId: 'field-college',
            valueText: 'MIT',
          }),
        ],
      });
    });

    it('does not write when submission already has answers', async () => {
      const mapSpy = jest
        .spyOn(service as any, 'mapFieldIdsToDatabaseIds')
        .mockResolvedValue({
          mappedAnswers: [{ fieldId: 'x', value: 'y' }],
          userCategory: 'COLLEGE_STUDENT',
        });

      prismaMock.hackathonEntity.findUnique.mockResolvedValue({
        ...openHackathonBase,
      } as any);

      prismaMock.teamMemberEntity.findFirst.mockResolvedValue({
        team: {
          id: 'team-1',
          hackathonId: 'hack-1',
          leaderId: 'user-1',
          name: 'T',
        },
      } as any);

      prismaMock.hackathonRegistrationSubmissionEntity.findFirst.mockResolvedValue(
        {
          id: 'sub-1',
          _count: { answers: 3 },
        } as any,
      );

      await service.ensureRegistrationAnswersAfterPayment({
        hackathonSlug: 'test-hack',
        userId: 'user-1',
        answers: [{ fieldId: 'x', value: 'y' }],
      });

      expect(
        prismaMock.hackathonRegistrationAnswerEntity.createMany,
      ).not.toHaveBeenCalled();
      expect(mapSpy).not.toHaveBeenCalled();
    });

    it('returns early for external registration forms', async () => {
      prismaMock.hackathonEntity.findUnique.mockResolvedValue({
        ...openHackathonBase,
        registrationForm: {
          externalFormLink: 'https://example.com/form',
          fields: [{ id: 'f1' }],
        },
      } as any);

      prismaMock.teamMemberEntity.findFirst.mockResolvedValue({
        team: {
          id: 'team-1',
          hackathonId: 'hack-1',
          leaderId: 'user-1',
          name: 'T',
        },
      } as any);

      await service.ensureRegistrationAnswersAfterPayment({
        hackathonSlug: 'test-hack',
        userId: 'user-1',
        answers: [{ fieldId: 'a', value: 'b' }],
      });

      expect(
        prismaMock.hackathonRegistrationSubmissionEntity.findFirst,
      ).not.toHaveBeenCalled();
      expect(
        prismaMock.hackathonRegistrationAnswerEntity.createMany,
      ).not.toHaveBeenCalled();
    });
  });

  describe('getRegistrationStatus', () => {
    it('hasSubmitted is false for shell submission with internal form fields', async () => {
      prismaMock.hackathonEntity.findUnique.mockResolvedValue({
        id: 'hack-1',
        isFree: false,
        chargeMode: HackathonChargeMode.PER_USER,
        registrationForm: {
          externalFormLink: null,
          fields: [{ id: 'f1' }],
        },
      } as any);

      prismaMock.teamMemberEntity.findFirst.mockResolvedValue({
        team: {
          id: 'team-1',
          name: 'T',
          leaderId: 'user-1',
          hackathonId: 'hack-1',
        },
      } as any);

      prismaMock.hackathonRegistrationSubmissionEntity.findUnique.mockResolvedValue(
        {
          id: 'sub-1',
          teamId: 'team-1',
          _count: { answers: 0 },
          answers: [],
        } as any,
      );

      prismaMock.hackathonPaymentEntity.findFirst.mockResolvedValue({
        paymentStatus: 'CAPTURED',
      } as any);

      const result = await service.getRegistrationStatus('slug', 'user-1');

      expect(result.hasRegistrationRecord).toBe(true);
      expect(result.hasSubmitted).toBe(false);
      expect(result.submissionId).toBe('sub-1');
      expect(result.isRegistrationIncomplete).toBe(true);
    });

    it('hasSubmitted is true when external form and submission exists', async () => {
      prismaMock.hackathonEntity.findUnique.mockResolvedValue({
        id: 'hack-1',
        isFree: true,
        chargeMode: HackathonChargeMode.PER_TEAM,
        registrationForm: {
          externalFormLink: 'https://forms.example/x',
          fields: [{ id: 'f1' }],
        },
      } as any);

      prismaMock.teamMemberEntity.findFirst.mockResolvedValue({
        team: {
          id: 'team-1',
          name: 'T',
          leaderId: 'user-1',
          hackathonId: 'hack-1',
        },
      } as any);

      prismaMock.hackathonRegistrationSubmissionEntity.findUnique.mockResolvedValue(
        {
          id: 'sub-1',
          teamId: 'team-1',
          _count: { answers: 0 },
          answers: [],
        } as any,
      );

      const result = await service.getRegistrationStatus('slug', 'user-1');

      expect(result.hasSubmitted).toBe(true);
      expect(result.hasRegistrationRecord).toBe(true);
    });
  });
});
