import { TeamService } from './team.service';

jest.mock('@oppskills/db', () => {
  const tx = {
    teamEntity: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    hackathonEntity: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    teamMemberEntity: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    hackathonRegistrationSubmissionEntity: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
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
  };

  return {
    prisma: {
      teamEntity: tx.teamEntity,
      hackathonEntity: tx.hackathonEntity,
      teamMemberEntity: tx.teamMemberEntity,
      hackathonRegistrationSubmissionEntity:
        tx.hackathonRegistrationSubmissionEntity,
      hackathonRegistrationAnswerEntity: tx.hackathonRegistrationAnswerEntity,
      registrationFormEntity: tx.registrationFormEntity,
      registrationFieldEntity: tx.registrationFieldEntity,
      userOnboardingProfileEntity: tx.userOnboardingProfileEntity,
      $transaction: jest.fn(async (cb: (txClient: typeof tx) => unknown) =>
        cb(tx),
      ),
    },
  };
});

import { prisma } from '@oppskills/db';

describe('TeamService', () => {
  let service: TeamService;
  const prismaMock = prisma as any;

  beforeEach(() => {
    service = new TeamService({ emit: jest.fn() } as any);
    jest.clearAllMocks();
  });

  describe('createTeam', () => {
    it('maps default-* answers to DB field IDs', async () => {
      const registrationFields = [
        {
          id: 'db-name',
          label: 'Name',
          type: 'TEXT',
          required: true,
          options: [],
          order: -50,
        },
        {
          id: 'db-email',
          label: 'Email',
          type: 'EMAIL',
          required: true,
          options: [],
          order: -40,
        },
        {
          id: 'db-phone',
          label: 'Phone No.',
          type: 'PHONE_NO',
          required: true,
          options: [],
          order: -30,
        },
        {
          id: 'db-gender',
          label: 'Gender',
          type: 'OPTIONS',
          required: true,
          options: ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY'],
          order: -20,
        },
        {
          id: 'db-school',
          label: 'School Name',
          type: 'TEXT',
          required: false,
          options: [],
          order: -10,
        },
        {
          id: 'db-college',
          label: 'College Name',
          type: 'TEXT',
          required: false,
          options: [],
          order: -9,
        },
        {
          id: 'db-company',
          label: 'Company Name',
          type: 'TEXT',
          required: false,
          options: [],
          order: -8,
        },
      ];

      prismaMock.hackathonEntity.findUnique.mockResolvedValueOnce({
        id: 'hack-1',
        ownerId: 'owner-1',
        isFree: true,
        maxTeams: null,
        participantType: 'TEAM_OF_2',
        status: 'PUBLISHED',
        approvalStatus: 'APPROVED',
        isRegistrationPaused: false,
        registrationDeadline: null,
        registrationForm: null,
        _count: { teams: 0 },
      });

      prismaMock.userOnboardingProfileEntity.findUnique.mockResolvedValueOnce({
        userCategory: 'COLLEGE_STUDENT',
      });

      prismaMock.registrationFormEntity.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'rf-1',
          fields: registrationFields,
        });

      prismaMock.registrationFormEntity.create.mockResolvedValueOnce({
        id: 'rf-1',
        fields: [],
      });

      prismaMock.registrationFieldEntity.create.mockImplementation(
        ({ data }) => {
          const label = String(data.label).toLowerCase();
          const idByLabel: Record<string, string> = {
            name: 'db-name',
            email: 'db-email',
            'phone no.': 'db-phone',
            gender: 'db-gender',
            'school name': 'db-school',
            'college name': 'db-college',
            'company name': 'db-company',
          };

          return {
            id: idByLabel[label] ?? `db-${label.replace(/\s+/g, '-')}`,
            ...data,
          };
        },
      );

      prismaMock.teamEntity.create.mockResolvedValueOnce({
        id: 'team-1',
        name: 'Team A',
        leader: {
          email: 'jane@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
        },
        hackathon: { name: 'Hackathon 1' },
      });
      prismaMock.hackathonRegistrationSubmissionEntity.create.mockResolvedValueOnce(
        { id: 'sub-1' },
      );
      prismaMock.hackathonEntity.update.mockResolvedValueOnce({});

      await service.createTeam(
        {
          name: 'Team A',
          hackathonId: 'hack-1',
          maxSize: 2,
          isOpen: true,
          answers: [
            { fieldId: 'default-name', value: 'Jane Doe' },
            { fieldId: 'default-email', value: 'jane@example.com' },
            { fieldId: 'default-phone', value: '+910000000000' },
            { fieldId: 'default-gender', value: 'MALE' },
            { fieldId: 'default-college-name', value: 'ABC College' },
          ],
        },
        'user-1',
      );

      expect(
        prismaMock.hackathonRegistrationSubmissionEntity.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hackathonId: 'hack-1',
            userId: 'user-1',
            isLeader: true,
          }),
        }),
      );

      expect(
        prismaMock.hackathonRegistrationAnswerEntity.createMany,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ fieldId: 'db-name' }),
            expect.objectContaining({ fieldId: 'db-email' }),
            expect.objectContaining({ fieldId: 'db-phone' }),
            expect.objectContaining({ fieldId: 'db-gender' }),
            expect.objectContaining({ fieldId: 'db-college' }),
          ]),
        }),
      );
    });
  });
});
