import { Test, TestingModule } from '@nestjs/testing';
import { UserLocationController } from './user-location.controller';
import { ClerkAuthConfigService } from 'src/common/config.service';
import { verifyToken } from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

describe('UserLocationController', () => {
  let controller: UserLocationController;
  const mockClerkAuthConfigService = {
    clerkSecretKey: 'mock-secret-key',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserLocationController],
      providers: [
        {
          provide: ClerkAuthConfigService,
          useValue: mockClerkAuthConfigService,
        },
      ],
    }).compile();

    controller = module.get<UserLocationController>(UserLocationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateLocation', () => {
    it('should log Anonymous and coordinates when no auth header is provided', async () => {
      const mockReq = { headers: {} };
      const mockCoords = { latitude: 12.34, longitude: 56.78 };

      const result = await controller.updateLocation(mockReq, mockCoords);

      expect(result).toEqual({ success: true });
    });

    it('should extract email and log coordinates when valid bearer token is provided', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer valid-token',
        },
      };
      const mockCoords = { latitude: 12.34, longitude: 56.78 };

      (verifyToken as jest.Mock).mockResolvedValue({
        emailAddresses: [{ emailAddress: 'user@example.com' }],
        sub: 'user_123',
      });

      const result = await controller.updateLocation(mockReq, mockCoords);

      expect(verifyToken).toHaveBeenCalledWith('valid-token', {
        secretKey: 'mock-secret-key',
        clockSkewInMs: 15000,
      });
      expect(result).toEqual({ success: true });
    });

    it('should log dev bypass email when AUTH_BYPASS is active', async () => {
      process.env.AUTH_BYPASS = 'true';
      const mockReq = {
        headers: {
          authorization: 'Bearer dev-token',
          'x-user-id': 'dev_user_123',
          'x-user-email': 'dev@example.com',
        },
      };
      const mockCoords = { latitude: 12.34, longitude: 56.78 };

      const result = await controller.updateLocation(mockReq, mockCoords);

      expect(result).toEqual({ success: true });
      delete process.env.AUTH_BYPASS;
    });

    it('should fallback to Anonymous when verification fails', async () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };
      const mockCoords = { latitude: 12.34, longitude: 56.78 };

      (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const result = await controller.updateLocation(mockReq, mockCoords);

      expect(result).toEqual({ success: true });
    });
  });
});
