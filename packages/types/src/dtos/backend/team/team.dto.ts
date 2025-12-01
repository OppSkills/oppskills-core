import { IsString, IsInt, Min, IsUUID } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsUUID()
  hackathonId: string;

  @IsInt()
  @Min(1)
  maxSize: number;

   @IsUUID()
  teamId: string;
}

