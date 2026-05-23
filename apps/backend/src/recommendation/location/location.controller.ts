import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ClerkAuthGuard } from 'src/common/clerk-auth.guard';
import { RateLimit } from 'src/common/rate-limit';
import { LocationService } from './location.service';
import {
  LocationAutocompleteQueryDto,
  LocationSuggestionDto,
} from '@oppskills/types';

@ApiTags('Recommendation')
@Controller('recommendation/location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  /**
   * Autosuggest places using Google Places API (New).
   */
  @Get('autocomplete')
  @UseGuards(ClerkAuthGuard)
  @ApiBearerAuth('clerk-auth')
  @RateLimit({
    limit: 30,
    windowMs: 60_000,
    keyPrefix: 'location:autocomplete',
  })
  @ApiOperation({
    summary: 'Autosuggest places / locations',
    description:
      'Search and autocomplete places using Google Places API (New) Autocomplete. Rate-limited to 30 requests per minute.',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    description: 'Search string / prefix (e.g. "GCET")',
    type: 'string',
    example: 'GCET',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved list of matching place suggestions.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          placeId: { type: 'string' },
          types: { type: 'array', items: { type: 'string' } },
          mainText: { type: 'string' },
          secondaryText: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Missing or invalid authentication token.',
  })
  @ApiResponse({
    status: 429,
    description: 'Too Many Requests - Rate limit exceeded.',
  })
  async autocomplete(
    @Query() query: LocationAutocompleteQueryDto,
  ): Promise<LocationSuggestionDto[]> {
    return this.locationService.getAutocompleteSuggestions(query.q);
  }
}
