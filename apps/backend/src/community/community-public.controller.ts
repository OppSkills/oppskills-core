import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CommunityService } from './community.service';

@ApiTags('Communities Public')
@Controller('communities/public')
export class CommunityPublicController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('by-handle/:handle')
  @ApiOperation({
    summary: 'Get public community details by handle',
    description: 'Retrieves public information about a community for OG metadata.',
  })
  @ApiResponse({ status: 200, description: 'Community public details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Community not found' })
  async getPublicCommunityByHandle(@Param('handle') handle: string) {
    return this.communityService.getCommunityByHandle(handle);
  }
}
