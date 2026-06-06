import { ApiProperty } from '@nestjs/swagger';

export class CheckCommunityHandleResponseDto {
  @ApiProperty({ example: true })
  available: boolean;
}

export class SuggestCommunityHandlesResponseDto {
  @ApiProperty({ type: [String], example: ['oppskills-devs', 'oppskills-devs-2'] })
  suggestions: string[];
}
