import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from "class-validator";
import {
  EventRegistrationFormDto,
  EventPrizeBreakdownDto,
  EventAdditionalInfoDto,
} from "@oppskills/types";

/**
 * Payload to replace the entire registration form definition for an event.
 */
export class UpdateEventRegistrationFormDto {
  @ApiProperty({ type: () => EventRegistrationFormDto })
  @ValidateNested()
  @Type(() => EventRegistrationFormDto)
  registrationForm: EventRegistrationFormDto;
}

/**
 * Payload to replace the entire prize breakdown list for an event.
 */
export class UpdateEventPrizeBreakdownDto {
  @ApiProperty({ type: () => [EventPrizeBreakdownDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventPrizeBreakdownDto)
  prizeBreakdown: EventPrizeBreakdownDto[];
}

/**
 * Payload to update max users.
 * - `null` means "no limit" (unlimited participants).
 */
export class UpdateEventMaxUsersDto {
  @ApiPropertyOptional({
    description: "Maximum number of users (null = unlimited)",
    nullable: true,
    minimum: 1,
  })
  @IsOptional()
  @ValidateIf((o: UpdateEventMaxUsersDto) => o.maxUsers !== null)
  @IsInt()
  @Min(1)
  maxUsers?: number | null;
}

/**
 * Payload to update additional info (contact + attachments) for an event.
 */
export class UpdateEventAdditionalInfoDto {
  @ApiPropertyOptional({ type: () => EventAdditionalInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventAdditionalInfoDto)
  additionalInfo?: EventAdditionalInfoDto;
}
