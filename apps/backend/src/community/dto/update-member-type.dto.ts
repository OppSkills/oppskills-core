import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateMemberTypeDto {
  @ApiProperty({
    description: 'The new member type (role string)',
    example: 'Media Lead',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role: string;
}
