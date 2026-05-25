jest.mock('@oppskills/db', () => ({
  prisma: {
    teamEntity: {
      findFirst: jest.fn(),
    },
    teamMemberEntity: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    ticketTierEntity: {
      findFirst: jest.fn(),
    },
    hackathonPaymentEntity: {
      findFirst: jest.fn(),
    },
  },
  LifecycleStatus: { PUBLISHED: 'PUBLISHED' },
  ApprovalStatus: { APPROVED: 'APPROVED' },
  HackathonChargeMode: {
    PER_TEAM: 'PER_TEAM',
    PER_USER: 'PER_USER',
  },
  HackathonPaymentScope: {
    TEAM: 'TEAM',
    USER: 'USER',
  },
  HackathonPaymentStatus: {
    AUTHORIZED: 'AUTHORIZED',
    CAPTURED: 'CAPTURED',
  },
}));

import { BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DraftTeamService } from './draft-team.service';
import { ReferralService } from '../../referral/referral.service';
import { prisma } from '@oppskills/db';

describe('DraftTeamService (free ticket tiers)', () => {
  let service: DraftTeamService;
  const prismaMock = prisma as any;

  const paidHackathon = {
    id: 'hack-1',
    slug: 'paid-hack',
    name: 'Paid Hack',
    ownerId: 'owner-1',
    status: 'PUBLISHED',
    approvalStatus: 'APPROVED',
    isRegistrationPaused: false,
    registrationDeadline: null,
    isFree: false,
    chargeMode: 'PER_USER',
  };

  const baseTeam = {
    id: 'team-1',
    name: 'Alpha',
    maxSize: 4,
    isOpen: true,
    leaderId: 'leader-1',
    hackathonId: 'hack-1',
    ticketTierId: null,
    ticketTier: null,
    hackathon: paidHackathon,
    members: [],
    leader: {
      id: 'leader-1',
      firstName: 'Lead',
      lastName: 'Er',
      email: 'lead@example.com',
    },
  };

  beforeEach(() => {
    service = new DraftTeamService(
      { emit: jest.fn() } as unknown as EventEmitter2,
      { markRegistrationAttributed: jest.fn() } as unknown as ReferralService,
    );
    jest.clearAllMocks();
    prismaMock.teamEntity.findFirst
      .mockResolvedValueOnce(baseTeam)
      .mockResolvedValueOnce(null);
    prismaMock.teamMemberEntity.create.mockResolvedValue({
      id: 'member-1',
      user: {
        id: 'user-2',
        firstName: 'Mem',
        lastName: 'Ber',
        email: 'mem@example.com',
      },
    });
    prismaMock.teamMemberEntity.updateMany.mockResolvedValue({ count: 0 });
  });

  it('allows PER_USER join without payment when joining with a free ticket tier', async () => {
    prismaMock.ticketTierEntity.findFirst.mockResolvedValue({
      id: 'tier-free',
      isFree: true,
      price: 0,
    });

    await service.joinDraftTeam({
      userId: 'user-2',
      invitationCode: 'ABC123',
      ticketTierId: 'tier-free',
    });

    expect(prismaMock.hackathonPaymentEntity.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.teamMemberEntity.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          ticketTierId: 'tier-free',
        }),
      }),
    );
  });

  it('requires payment for PER_USER join when tier is paid', async () => {
    prismaMock.ticketTierEntity.findFirst.mockResolvedValue({
      id: 'tier-paid',
      isFree: false,
      price: 299,
    });

    await expect(
      service.joinDraftTeam({
        userId: 'user-2',
        invitationCode: 'ABC123',
        ticketTierId: 'tier-paid',
      }),
    ).rejects.toThrow(
      'This ticket requires payment. Complete checkout for paid tiers.',
    );
  });

  it('allows PER_TEAM member join when team already has a free tier', async () => {
    const teamWithFreeTier = {
      ...baseTeam,
      ticketTierId: 'tier-free',
      ticketTier: { isFree: true, price: 0 },
      hackathon: { ...paidHackathon, chargeMode: 'PER_TEAM' },
    };
    prismaMock.teamEntity.findFirst.mockReset();
    prismaMock.teamEntity.findFirst
      .mockResolvedValueOnce(teamWithFreeTier)
      .mockResolvedValueOnce(null);

    await service.joinDraftTeam({
      userId: 'user-2',
      invitationCode: 'ABC123',
    });

    expect(prismaMock.hackathonPaymentEntity.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.teamMemberEntity.create).toHaveBeenCalled();
  });

  it('blocks PER_TEAM member join when team has no payment and no free tier', async () => {
    const perTeamHackathon = { ...paidHackathon, chargeMode: 'PER_TEAM' };
    prismaMock.teamEntity.findFirst.mockReset();
    prismaMock.teamEntity.findFirst
      .mockResolvedValueOnce({
        ...baseTeam,
        hackathon: perTeamHackathon,
      })
      .mockResolvedValueOnce(null);
    prismaMock.hackathonPaymentEntity.findFirst.mockResolvedValue(null);

    await expect(
      service.joinDraftTeam({
        userId: 'user-2',
        invitationCode: 'ABC123',
      }),
    ).rejects.toThrow(
      'Team payment must be completed by the leader before members can join',
    );
  });
});
