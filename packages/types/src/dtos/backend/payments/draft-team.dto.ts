import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from "class-validator";

export class CreateDraftTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  maxSize?: number;
}

export class JoinDraftTeamDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  invitationCode?: string;

  /**
   * Optional referral code (from `oppskills_ref` cookie). Attributed to the
   * resulting TeamMemberEntity and counted on the referrer's dashboard.
   * Silently ignored if invalid / mismatched.
   */
  @IsOptional()
  @IsString()
  referralCode?: string;

  /** Free ticket tier — skips payment check when joining a paid hackathon. */
  @IsOptional()
  @IsString()
  ticketTierId?: string;
}

export class LeaveDraftTeamDto {
  @IsString()
  @IsNotEmpty()
  teamId: string;
}
