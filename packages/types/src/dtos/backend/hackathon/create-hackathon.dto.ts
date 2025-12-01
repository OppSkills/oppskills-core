import { IsString, IsDateString, IsOptional, IsIn } from 'class-validator';
export class CreateHackathonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
 @IsIn(['ONLINE', 'OFFLINE', 'HYBRID'])
  mode: 'ONLINE' | 'OFFLINE' | 'HYBRID';
}


