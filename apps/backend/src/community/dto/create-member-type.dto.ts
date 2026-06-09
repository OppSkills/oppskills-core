import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateMemberTypeDto {
  @ApiProperty({
    description: 'The member type label to create',
    example: 'Media Lead',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role: string;
}
