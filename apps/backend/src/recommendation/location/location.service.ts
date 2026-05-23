import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'src/_utils/logger';
import type { LocationSuggestionDto } from '@oppskills/types';

interface GoogleAutocompletePrediction {
  placePrediction?: {
    placeId?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
    types?: string[];
  };
}

interface GoogleAutocompleteResponse {
  suggestions?: GoogleAutocompletePrediction[];
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly apiKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAP_API');
  }

  /**
   * Retrieves place suggestions from Google Places API (New) Autocomplete.
   *
   * @param query The input string to autocomplete (e.g. "GCET")
   */
  async getAutocompleteSuggestions(
    query: string,
  ): Promise<LocationSuggestionDto[]> {
    const trimmedQuery = query ? query.trim() : '';
    if (!trimmedQuery) {
      return [];
    }

    if (!this.apiKey) {
      this.logger.error(
        'GOOGLE_MAP_API is not defined in the environment variables.',
      );
      throw new InternalServerErrorException(
        'Location auto-suggest service is currently misconfigured.',
      );
    }

    const url = 'https://places.googleapis.com/v1/places:autocomplete';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
        },
        body: JSON.stringify({ input: trimmedQuery }),
      });

      const data = (await response.json()) as GoogleAutocompleteResponse;

      if (!response.ok) {
        this.logger.error(
          `Google Places API error (Status: ${response.status}): ${JSON.stringify(data)}`,
        );
        throw new InternalServerErrorException(
          'Failed to retrieve location autocomplete suggestions from provider.',
        );
      }

      const suggestionsList = data.suggestions || [];

      return suggestionsList
        .map((item): LocationSuggestionDto | null => {
          const pred = item.placePrediction;
          if (!pred) {
            return null;
          }

          return {
            description:
              pred.text?.text || pred.structuredFormat?.mainText?.text || '',
            placeId: pred.placeId || '',
            types: pred.types || [],
            mainText: pred.structuredFormat?.mainText?.text || '',
            secondaryText: pred.structuredFormat?.secondaryText?.text || '',
          };
        })
        .filter((s): s is LocationSuggestionDto => s !== null);
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }
      this.logger.error(
        `Unexpected error during location autocomplete: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new InternalServerErrorException(
        'An unexpected error occurred while processing location suggestions.',
      );
    }
  }

  /**
   * Retrieves latitude and longitude coordinates for a given place ID.
   *
   * @param placeId The place ID to retrieve coordinates for
   * @returns A string in the format "lat,lng" or null if not found/error.
   */
  async getPlaceCoords(placeId: string): Promise<string | null> {
    const trimmedId = placeId ? placeId.trim() : '';
    if (!trimmedId) {
      return null;
    }

    if (!this.apiKey) {
      this.logger.error(
        'GOOGLE_MAP_API is not defined in the environment variables.',
      );
      return null;
    }

    const url = `https://places.googleapis.com/v1/places/${trimmedId}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'location',
        },
      });

      const data = (await response.json()) as {
        location?: { latitude?: number; longitude?: number };
      };

      if (!response.ok) {
        this.logger.error(
          `Google Places Details API error (Status: ${response.status}): ${JSON.stringify(data)}`,
        );
        return null;
      }

      if (
        data.location?.latitude !== undefined &&
        data.location?.longitude !== undefined
      ) {
        return `${data.location.latitude},${data.location.longitude}`;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Unexpected error during getPlaceCoords: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }
}
