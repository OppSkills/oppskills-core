import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';
import { ClerkAuthConfigService } from 'src/common/config.service';

describe('LocationController', () => {
  let controller: LocationController;
  let service: LocationService;

  const mockLocationService = {
    getAutocompleteSuggestions: jest.fn(),
  };

  const mockClerkAuthConfigService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
        {
          provide: ClerkAuthConfigService,
          useValue: mockClerkAuthConfigService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    service = module.get<LocationService>(LocationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('autocomplete', () => {
    it('should call getAutocompleteSuggestions and return the results', async () => {
      const mockResult = [
        {
          description: 'GCET College, Noida',
          placeId: 'place_123',
          types: ['establishment'],
          mainText: 'GCET College',
          secondaryText: 'Noida',
        },
      ];
      mockLocationService.getAutocompleteSuggestions.mockResolvedValue(mockResult);

      const result = await controller.autocomplete({ q: 'GCET' });

      expect(service.getAutocompleteSuggestions).toHaveBeenCalledWith('GCET');
      expect(result).toEqual(mockResult);
    });
  });
});
