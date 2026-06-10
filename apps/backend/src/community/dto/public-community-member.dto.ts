import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PublicCommunityMemberItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  avatarUrl: string | null;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: [String] })
  skills: string[];

  @ApiProperty({ type: [String] })
  interests: string[];

  @ApiPropertyOptional()
  subtitle?: string;

  @ApiPropertyOptional()
  userCategory?: string;
}

export class PublicCommunityMembersResponseDto {
  @ApiProperty({ type: [PublicCommunityMemberItemDto] })
  items: PublicCommunityMemberItemDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  page: number;
}
