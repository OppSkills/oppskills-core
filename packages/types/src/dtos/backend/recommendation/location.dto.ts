import { IsNotEmpty, IsString, MinLength } from "class-validator";

/**
 * DTO for querying location autocomplete.
 */
export class LocationAutocompleteQueryDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  q: string;
}

/**
 * Cleaned suggestion format returned to the client.
 */
export interface LocationSuggestionDto {
  description: string;
  placeId: string;
  types: string[];
  mainText: string;
  secondaryText: string;
}
