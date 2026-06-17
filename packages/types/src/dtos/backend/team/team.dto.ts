import {
  IsString,
  IsInt,
  Min,
  IsUUID,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export function IsAnswerValue(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isAnswerValue",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value === "string") return true;
          if (typeof value === "number" && Number.isFinite(value)) return true;
          if (
            Array.isArray(value) &&
            value.every((item) => typeof item === "string")
          ) {
            return true;
          }
          return false;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a string, a finite number, or an array of strings`;
        },
      },
    });
  };
}

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
  @IsAnswerValue()
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
    example: "cmjs132o7001yq901uh8byh06",
  })
  @IsString()
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

  @ApiPropertyOptional({
    description: "Referral code for attribution",
    example: "REF_XYZ123",
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

/**
 * DTO for joining a team by ID or invitation code.
 */
export class JoinTeamDto {
  @ApiPropertyOptional({
    description: "Team ID to join",
    example: "cmjs132o7001yq901uh8byh07",
  })
  @IsOptional()
  @IsString()
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

  @ApiPropertyOptional({
    description: "Referral code for attribution",
    example: "REF_XYZ123",
  })
  @IsOptional()
  @IsString()
  referralCode?: string;
}

/**
 * DTO for requesting to join a team.
 */
export class RequestJoinTeamDto {
  @ApiProperty({
    description: "Team ID to request joining",
    example: "cmjs132o7001yq901uh8byh07",
  })
  @IsOptional()
  @IsString()
  teamId?: string;

  @ApiPropertyOptional({
    description: "Invitation code to join a team",
    example: "ABC123XY",
  })
  @IsOptional()
  @IsString()
  invitationCode?: string;
}

/**
 * DTO for responding to a team join request.
 */
export class RespondJoinRequestDto {
  @ApiProperty({
    description: "Status to set for the request",
    enum: ["ACCEPTED", "REJECTED"],
    example: "ACCEPTED",
  })
  @IsString()
  status: "ACCEPTED" | "REJECTED";
}

