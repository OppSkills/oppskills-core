import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CommunityIndustryValue } from '@oppskills/types';

export class CommunityResponseDto {
  @ApiProperty({ example: 'clxyz123communityid' })
  id: string;

  @ApiProperty({ example: 'OppSkills Developers' })
  name: string;

  @ApiProperty({ example: 'oppskills-devs' })
  handle: string;

  @ApiPropertyOptional({
    example: 'A community for builders and learners.',
  })
  description: string | null;

  @ApiPropertyOptional({ example: 'https://example.com' })
  website: string | null;

  @ApiProperty({ example: 'TECHNOLOGY' })
  industry: CommunityIndustryValue;

  @ApiPropertyOptional({
    example: 'https://cdn.oppskills.com/public/community-covers/user/abc.jpg',
  })
  coverImage: string | null;

  @ApiPropertyOptional({
    example: 'https://cdn.oppskills.com/public/community-avatars/user/abc.jpg',
  })
  avatarImage: string | null;

  @ApiProperty({ example: '2026-05-25T12:00:00.000Z' })
  createdAt: Date;
}
