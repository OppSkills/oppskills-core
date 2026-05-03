import {
  formatListingLocation,
  IncompleteRegistrationReminderService,
} from './incomplete-registration-reminder.service';
import { EmailService } from './email.service';
import { prisma } from '@oppskills/db';

jest.mock('@oppskills/db', () => {
  const queryRaw = jest.fn();
  const upsert = jest.fn().mockResolvedValue(undefined);
  return {
    prisma: {
      $queryRaw: queryRaw,
      incompleteRegistrationReminderLogEntity: { upsert },
    },
  };
});

describe('formatListingLocation', () => {
  it('returns Online for VIRTUAL', () => {
    expect(
      formatListingLocation({
        locationType: 'VIRTUAL',
        locationAddress: null,
        locationCity: null,
        locationVirtualLink: null,
      }),
    ).toBe('Online');
  });

  it('joins address and city for PHYSICAL', () => {
    expect(
      formatListingLocation({
        locationType: 'PHYSICAL',
        locationAddress: 'Street 1',
        locationCity: 'Delhi',
        locationVirtualLink: null,
      }),
    ).toBe('Street 1, Delhi');
  });

  it('uses virtual link as Online fallback', () => {
    expect(
      formatListingLocation({
        locationType: null,
        locationAddress: null,
        locationCity: null,
        locationVirtualLink: 'https://meet.example.com',
      }),
    ).toBe('Online');
  });
});

describe('IncompleteRegistrationReminderService.run', () => {
  const mockSend = jest.fn().mockResolvedValue({ success: true });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FRONTEND_URL = 'https://app.example';
    (prisma.$queryRaw as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (
      prisma.incompleteRegistrationReminderLogEntity.upsert as jest.Mock
    ).mockClear();
    mockSend.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    delete process.env.FRONTEND_URL;
  });

  it('sends hackathon reminder with resourceType hackathon and upserts log', async () => {
    const start = new Date('2026-03-01T10:00:00.000Z');
    (prisma.$queryRaw as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce([
        {
          paymentId: 'pay-h1',
          slug: 'hack-slug',
          title: 'Hack Title',
          startDate: start,
          endDate: start,
          locationType: 'VIRTUAL',
          locationAddress: null,
          locationCity: null,
          locationVirtualLink: null,
          payerEmail: 'p@x.com',
          firstName: 'Pat',
          lastName: 'Lee',
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const service = new IncompleteRegistrationReminderService({
      send: mockSend,
    } as unknown as EmailService);

    const result = await service.run();

    expect(result.hackathonEmailsAttempted).toBe(1);
    expect(result.hackathonEmailsSent).toBe(1);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'incomplete-registration',
        to: 'p@x.com',
        props: expect.objectContaining({
          resourceType: 'hackathon',
          eventSlug: 'hack-slug',
          baseUrl: 'https://app.example',
        }),
      }),
    );
    expect(
      prisma.incompleteRegistrationReminderLogEntity.upsert,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { hackathonPaymentId: 'pay-h1' },
      }),
    );
  });

  it('does not upsert log when email send fails', async () => {
    const start = new Date('2026-03-01T10:00:00.000Z');
    (prisma.$queryRaw as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce([
        {
          paymentId: 'pay-fail',
          slug: 's',
          title: 'T',
          startDate: start,
          endDate: start,
          locationType: null,
          locationAddress: null,
          locationCity: null,
          locationVirtualLink: null,
          payerEmail: 'x@y.com',
          firstName: null,
          lastName: null,
        },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    mockSend.mockResolvedValue({ success: false, error: 'bounce' });

    const service = new IncompleteRegistrationReminderService({
      send: mockSend,
    } as unknown as EmailService);

    await service.run();

    expect(
      prisma.incompleteRegistrationReminderLogEntity.upsert,
    ).not.toHaveBeenCalled();
  });
});

describe('Incomplete registration CTA URL pattern', () => {
  it('matches email template paths for events vs hackathons', () => {
    const base = 'https://oppskills.com';
    const slug = 'my-slug';
    expect(`${base}/events/${slug}`).toContain('/events/my-slug');
    expect(`${base}/hackathons/${slug}?registration=complete`).toContain(
      '/hackathons/my-slug?registration=complete',
    );
  });
});
