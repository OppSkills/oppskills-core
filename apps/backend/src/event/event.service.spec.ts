jest.mock('@oppskills/db', () => {
  const tx = {
    eventEntity: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userEntity: {
      findUnique: jest.fn(),
    },
    eventRegistrationFormEntity: {
      findUnique: jest.fn(),
    },
    eventRegistrationAnswerEntity: {
      findMany: jest.fn(),
    },
  };

  return {
    prisma: {
      eventEntity: tx.eventEntity,
      userEntity: tx.userEntity,
      eventRegistrationFormEntity: tx.eventRegistrationFormEntity,
      eventRegistrationAnswerEntity: tx.eventRegistrationAnswerEntity,
      $transaction: jest.fn(async (cb: (txClient: typeof tx) => unknown) =>
        cb(tx),
      ),
    },
  };
});

import { EventService } from './event.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { prisma } from '@oppskills/db';

describe('EventService - Google Sheets logging', () => {
  let service: EventService;
  let googleSheetsService: GoogleSheetsService;
  const prismaMock = prisma as any;

  beforeEach(() => {
    googleSheetsService = {
      appendRegistrationRow: jest.fn(),
    } as any;
    service = new EventService(googleSheetsService);
    jest.clearAllMocks();
  });

  describe('logToGoogleSheets', () => {
    it('should log to Google Sheets for the target event ID', async () => {
      const targetEventId = 'cmjn3pgst0001oz01flu5hcgw';
      const userId = 'user-123';
      const answers = [{ fieldId: 'field-1', value: 'Test Answer' }];

      // Mock database responses
      prismaMock.userEntity.findUnique.mockResolvedValue({
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      });

      prismaMock.eventEntity.findUnique.mockResolvedValue({
        id: targetEventId,
        name: 'Test Event',
      });

      prismaMock.eventRegistrationFormEntity.findUnique.mockResolvedValue({
        id: 'form-1',
        fields: [{ id: 'field-1', label: 'Question 1' }],
      });

      prismaMock.eventRegistrationAnswerEntity.findMany.mockResolvedValue([]);

      // Call the private method via a public method (joinEvent)
      // Since logToGoogleSheets is private, we'll test it indirectly
      // by mocking the entire joinEvent flow

      // Instead, let's access the method using bracket notation
      await (service as any).logToGoogleSheets(
        targetEventId,
        userId,
        answers,
        'submission-123',
      );

      // Verify that appendRegistrationRow was called
      expect(googleSheetsService.appendRegistrationRow).toHaveBeenCalledTimes(
        1,
      );
      expect(googleSheetsService.appendRegistrationRow).toHaveBeenCalledWith(
        'Registrations',
        expect.objectContaining({
          eventId: targetEventId,
          userId: userId,
        }),
        expect.any(Object),
      );
    });

    it('should skip Google Sheets logging for non-target events', async () => {
      const nonTargetEventId = 'different-event-id';
      const userId = 'user-123';
      const answers = [{ fieldId: 'field-1', value: 'Test Answer' }];

      // Call the private method
      await (service as any).logToGoogleSheets(
        nonTargetEventId,
        userId,
        answers,
        'submission-123',
      );

      // Verify that appendRegistrationRow was NOT called
      expect(googleSheetsService.appendRegistrationRow).not.toHaveBeenCalled();

      // Verify that database calls were NOT made (early return)
      expect(prismaMock.userEntity.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.eventEntity.findUnique).not.toHaveBeenCalled();
    });

    it('should not throw errors when skipping non-target events', async () => {
      const nonTargetEventId = 'another-event-id';
      const userId = 'user-456';
      const answers: any[] = [];

      // This should not throw
      await expect(
        (service as any).logToGoogleSheets(nonTargetEventId, userId, answers),
      ).resolves.toBeUndefined();
    });
  });
});
