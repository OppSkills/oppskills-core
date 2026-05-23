import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import { ConfigService } from '@nestjs/config';

describe('LocationService', () => {
  let service: LocationService;

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'GOOGLE_MAP_API') {
        return 'test-api-key';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAutocompleteSuggestions', () => {
    it('should return an empty array if query is empty', async () => {
      const result = await service.getAutocompleteSuggestions('');
      expect(result).toEqual([]);
    });

    it('should fetch suggestions from Google and clean them', async () => {
      const mockGoogleResponse = {
        suggestions: [
          {
            placePrediction: {
              placeId: 'place_123',
              text: { text: 'GCET College, Noida' },
              structuredFormat: {
                mainText: { text: 'GCET College' },
                secondaryText: { text: 'Noida' },
              },
              types: ['establishment'],
            },
          },
        ],
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockGoogleResponse),
      });

      const result = await service.getAutocompleteSuggestions('GCET');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://places.googleapis.com/v1/places:autocomplete',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': 'test-api-key',
          },
          body: JSON.stringify({ input: 'GCET' }),
        }),
      );

      expect(result).toEqual([
        {
          description: 'GCET College, Noida',
          placeId: 'place_123',
          types: ['establishment'],
          mainText: 'GCET College',
          secondaryText: 'Noida',
        },
      ]);
    });
  });

  describe('getPlaceCoords', () => {
    it('should return null if placeId is empty', async () => {
      const result = await service.getPlaceCoords('');
      expect(result).toBeNull();
    });

    it('should fetch place details from Google and return coordinates string', async () => {
      const mockGoogleDetailsResponse = {
        location: {
          latitude: 28.4594965,
          longitude: 77.4984261,
        },
      };

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(mockGoogleDetailsResponse),
      });

      const result = await service.getPlaceCoords('place_123');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://places.googleapis.com/v1/places/place_123',
        expect.objectContaining({
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': 'test-api-key',
            'X-Goog-FieldMask': 'location',
          },
        }),
      );

      expect(result).toBe('28.4594965,77.4984261');
    });

    it('should return null if fetch fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ error: 'Internal Error' }),
      });

      const result = await service.getPlaceCoords('place_123');
      expect(result).toBeNull();
    });
  });
});
