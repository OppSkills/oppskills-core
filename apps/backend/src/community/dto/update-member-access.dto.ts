import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CommunityAccessControlRole } from '@prisma/client';

export class UpdateMemberAccessDto {
  @ApiProperty({
    description: 'The new access control role',
    enum: CommunityAccessControlRole,
    example: CommunityAccessControlRole.MODERATOR,
  })
  @IsEnum(CommunityAccessControlRole)
  accessControlRole: CommunityAccessControlRole;
}
