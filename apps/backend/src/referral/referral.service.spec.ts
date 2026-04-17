import 'reflect-metadata';
import { ReferralEntityTypeDto } from '@oppskills/types';
import { ReferralService } from './referral.service';
import { prisma } from '@oppskills/db';

jest.mock('@oppskills/db', () => ({
  prisma: {
    referralEntity: {
      findUnique: jest.fn(),
    },
  },
}));

describe('ReferralService.resolveForRegistration', () => {
  const service = new ReferralService(
    {} as any,
    {} as any,
    { incrementRegistration: jest.fn(), trackClick: jest.fn() } as any,
  );

  beforeEach(() => {
    (prisma.referralEntity.findUnique as jest.Mock).mockReset();
  });

  it('returns null when referral belongs to same user', async () => {
    (prisma.referralEntity.findUnique as jest.Mock).mockResolvedValue({
      id: 'ref_1',
      isDeleted: false,
      isActive: true,
      referrerId: 'u_1',
      entityType: 'EVENT',
      entityId: 'evt_1',
    });
    const result = await service.resolveForRegistration({
      code: 'ABC123',
      userId: 'u_1',
      expectedEntityType: ReferralEntityTypeDto.EVENT,
      expectedEntityId: 'evt_1',
    });
    expect(result).toBeNull();
  });

  it('returns referral id when type and entity match', async () => {
    (prisma.referralEntity.findUnique as jest.Mock).mockResolvedValue({
      id: 'ref_2',
      isDeleted: false,
      isActive: true,
      referrerId: 'u_2',
      entityType: 'HACKATHON',
      entityId: 'hack_1',
    });
    const result = await service.resolveForRegistration({
      code: 'ABC123',
      userId: 'u_9',
      expectedEntityType: ReferralEntityTypeDto.HACKATHON,
      expectedEntityId: 'hack_1',
    });
    expect(result).toBe('ref_2');
  });
});
