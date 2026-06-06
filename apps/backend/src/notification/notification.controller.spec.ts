import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationQueue } from './queue/notification.queue';
import { NotificationWorker } from './queue/notification.worker';
import { ClerkAuthConfigService } from 'src/common/config.service';

describe('NotificationController', () => {
  let controller: NotificationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        NotificationService,
        {
          provide: NotificationQueue,
          useValue: {
            add: jest.fn(),
          },
        },
        {
          provide: NotificationWorker,
          useValue: {},
        },
        {
          provide: ClerkAuthConfigService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
