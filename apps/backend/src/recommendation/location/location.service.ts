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
  private readonly isApiKeyConfigured: boolean;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GOOGLE_MAP_API');
    this.isApiKeyConfigured = !!this.apiKey?.trim();
    if (!this.isApiKeyConfigured) {
      this.logger.warn(
        'GOOGLE_MAP_API is not configured. Location autocomplete suggestions and coordinate resolution will be disabled.',
      );
    }
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

    if (!this.isApiKeyConfigured) {
      throw new InternalServerErrorException(
        'Location auto-suggest service is currently misconfigured.',
      );
    }

    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey!,
        },
        body: JSON.stringify({ input: trimmedQuery }),
        signal: controller.signal,
      });

      const data = (await response.json()) as GoogleAutocompleteResponse;

      if (!response.ok) {
        let errorMsg = `Google Places API error (Status: ${response.status}): ${JSON.stringify(data)}`;
        if (response.status === 403) {
          errorMsg += ' - Attempting fallback to Legacy Google Places Autocomplete API...';
          this.logger.warn(errorMsg);
          return this.fetchLegacyAutocomplete(trimmedQuery);
        }
        this.logger.error(errorMsg);
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
      this.logger.warn(
        `Error during location autocomplete with Places API (New): ${error instanceof Error ? error.message : String(error)}. Attempting legacy fallback...`,
      );
      return this.fetchLegacyAutocomplete(trimmedQuery);
    } finally {
      clearTimeout(timeoutId);
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

    if (!this.isApiKeyConfigured) {
      return null;
    }

    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(trimmedId)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': this.apiKey!,
          'X-Goog-FieldMask': 'location',
        },
        signal: controller.signal,
      });

      const data = (await response.json()) as {
        location?: { latitude?: number; longitude?: number };
      };

      if (!response.ok) {
        let errorMsg = `Google Places Details API error (Status: ${response.status}): ${JSON.stringify(data)}`;
        if (response.status === 403) {
          errorMsg += ' - Attempting fallback to Legacy Google Place Details API...';
          this.logger.warn(errorMsg);
          return this.fetchLegacyPlaceCoords(trimmedId);
        }
        this.logger.error(errorMsg);
        return null;
      }

      if (
        data.location?.latitude !== undefined &&
        data.location?.longitude !== undefined
      ) {
        return `${data.location.latitude},${data.location.longitude},${trimmedId}`;
      }

      return null;
    } catch (error) {
      this.logger.warn(
        `Error during getPlaceCoords with Places API (New): ${error instanceof Error ? error.message : String(error)}. Attempting legacy fallback...`,
      );
      return this.fetchLegacyPlaceCoords(trimmedId);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchLegacyAutocomplete(
    query: string,
  ): Promise<LocationSuggestionDto[]> {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = (await response.json()) as {
        predictions?: Array<{
          description?: string;
          place_id?: string;
          types?: string[];
          structured_formatting?: {
            main_text?: string;
            secondary_text?: string;
          };
        }>;
        status: string;
        error_message?: string;
      };

      if (!response.ok || (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')) {
        let errorMsg = `Google Legacy Places Autocomplete API error (Status: ${data.status}): ${data.error_message || 'Unknown error'}`;
        if (data.status === 'REQUEST_DENIED') {
          errorMsg += ' - If the error mentions referer restrictions, note that server-to-server requests from NestJS will be blocked. Consider using a separate unrestricted or IP-restricted key for the backend.';
        }
        this.logger.error(errorMsg);
        return [];
      }

      const predictions = data.predictions || [];
      return predictions.map((pred) => ({
        description: pred.description || '',
        placeId: pred.place_id || '',
        types: pred.types || [],
        mainText: pred.structured_formatting?.main_text || '',
        secondaryText: pred.structured_formatting?.secondary_text || '',
      }));
    } catch (err) {
      this.logger.error(
        `Error calling Legacy Autocomplete: ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async fetchLegacyPlaceCoords(placeId: string): Promise<string | null> {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${this.apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = (await response.json()) as {
        result?: {
          geometry?: {
            location?: {
              lat?: number;
              lng?: number;
            };
          };
        };
        status: string;
        error_message?: string;
      };

      if (!response.ok || data.status !== 'OK') {
        let errorMsg = `Google Legacy Places Details API error (Status: ${data.status}): ${data.error_message || 'Unknown error'}`;
        if (data.status === 'REQUEST_DENIED') {
          errorMsg += ' - If the error mentions referer restrictions, note that server-to-server requests from NestJS will be blocked. Consider using a separate unrestricted or IP-restricted key for the backend.';
        }
        this.logger.error(errorMsg);
        return null;
      }

      const loc = data.result?.geometry?.location;
      if (loc && loc.lat !== undefined && loc.lng !== undefined) {
        return `${loc.lat},${loc.lng},${placeId.trim()}`;
      }
      return null;
    } catch (err) {
      this.logger.error(
        `Error calling Legacy Place Details: ${err instanceof Error ? err.message : String(err)}`,
      );
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
