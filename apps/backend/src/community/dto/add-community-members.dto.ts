import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { CommunityAccessControlRole } from '@prisma/client';

export class AddCommunityMembersDto {
  @ApiProperty({
    description: 'Array of user IDs to add to the community',
    type: [String],
    example: ['user_1', 'user_2'],
  })
  @IsArray()
  @IsString({ each: true })
  userIds: string[];

  @ApiProperty({
    description: 'The member type (role string) to assign to the users',
    example: 'MEMBER',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  role: string;

  @ApiProperty({
    description: 'The access control role to assign to the users',
    enum: CommunityAccessControlRole,
    example: CommunityAccessControlRole.READ_ONLY,
  })
  @IsEnum(CommunityAccessControlRole)
  accessControlRole: CommunityAccessControlRole;
}
