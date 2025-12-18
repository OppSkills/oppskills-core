import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import type { PrizeBreakdownDto } from '@oppskills/types';
import { RegistrationFormDto } from '@oppskills/types';
import { PrizeBreakdownDto as PrizeBreakdownDtoClass } from '@oppskills/types';

/**
 * Payload to replace the entire registration form definition for a hackathon.
 *
 * Why this exists:
 * - The generic `PUT /hackathons/:id` endpoint intentionally rejects nested updates
 *   (registration form, rounds, questions, prize breakdown, etc).
 * - This wrapper allows a dedicated endpoint to validate and document the payload.
 */
export class UpdateHackathonRegistrationFormDto {
  @ApiProperty({ type: () => RegistrationFormDto })
  @ValidateNested()
  @Type(() => RegistrationFormDto)
  registrationForm: RegistrationFormDto;
}

/**
 * Payload to replace the entire prize breakdown list for a hackathon.
 */
export class UpdateHackathonPrizeBreakdownDto {
  @ApiProperty({ type: () => [PrizeBreakdownDtoClass] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrizeBreakdownDtoClass)
  prizeBreakdown: PrizeBreakdownDto[];
}


