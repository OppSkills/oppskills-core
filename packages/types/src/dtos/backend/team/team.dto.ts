import { IsString, IsInt, Min, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ 
    description: 'Team name', 
    example: 'Code Warriors',
    maxLength: 120
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'ID of the hackathon this team is participating in', 
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsUUID()
  hackathonId: string;

  @ApiProperty({ 
    description: 'Maximum number of members allowed in the team', 
    minimum: 1,
    example: 4
  })
  @IsInt()
  @Min(1)
  maxSize: number;

  @ApiProperty({ 
    description: 'Team ID (used when joining an existing team)', 
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  @IsUUID()
  teamId: string;
}

