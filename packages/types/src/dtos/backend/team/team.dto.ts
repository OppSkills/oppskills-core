import {
  IsString,
  IsInt,
  Min,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

/**
 * A single registration answer for hackathon team registration.
 */
export class RegistrationAnswerDto {
  @ApiProperty({
    description: "Field ID from the registration form",
    example: "clxyz123...",
  })
  @IsString()
  fieldId: string;

  @ApiProperty({
    description:
      "Answer value (string, number, or array of strings for multi-select)",
    example: "John Doe",
  })
  value: string | number | string[];
}

export class CreateTeamDto {
  @ApiProperty({
    description: "Team name",
    example: "Code Warriors",
    maxLength: 120,
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: "ID of the hackathon this team is participating in",
    format: "uuid",
    example: "550e8400-e29b-41d4-a716-446655440000",
  })
  @IsUUID()
  hackathonId: string;

  @ApiPropertyOptional({
    description:
      "Maximum number of members allowed in the team (auto-set from participantType if not provided)",
    minimum: 1,
    example: 4,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSize?: number;

  @ApiPropertyOptional({
    description: "Team ID (used when joining an existing team)",
    format: "uuid",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({
    description: "Whether the team is open for others to browse and join",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional({
    description: "Registration form answers",
    type: [RegistrationAnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrationAnswerDto)
  answers?: RegistrationAnswerDto[];
}

/**
 * DTO for joining a team by ID or invitation code.
 */
export class JoinTeamDto {
  @ApiPropertyOptional({
    description: "Team ID to join",
    format: "uuid",
    example: "550e8400-e29b-41d4-a716-446655440001",
  })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({
    description: "Invitation code to join a team",
    example: "ABC123XY",
  })
  @IsOptional()
  @IsString()
  invitationCode?: string;

  @ApiPropertyOptional({
    description: "Registration form answers",
    type: [RegistrationAnswerDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegistrationAnswerDto)
  answers?: RegistrationAnswerDto[];
}
