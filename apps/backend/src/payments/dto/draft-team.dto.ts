import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateDraftTeamDto {
  @IsString()
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
  teamId: string;
}
