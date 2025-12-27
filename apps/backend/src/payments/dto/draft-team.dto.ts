import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';

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
}

export class LeaveDraftTeamDto {
  @IsString()
  @IsNotEmpty()
  teamId: string;
}
