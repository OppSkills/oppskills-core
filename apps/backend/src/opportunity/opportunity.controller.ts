import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OpportunityService } from './opportunity.service';

@ApiTags('Opportunities')
@Controller('opportunity')
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  /**
   * GET /opportunity/public/past - List past public opportunities.
   * Merged events and hackathons (Deadline < Now).
   */
  @Get('public/past')
  @ApiOperation({
    summary: 'List past public opportunities (Deadline < Now)',
  })
  async listPublicPastOpportunities(
    @Query('festival_id') festivalId?: string,
    @Query('page') page?: number,
    @Query('appendResults') appendResults?: boolean,
    @Query('q') search?: string,
  ) {
    return this.opportunityService.listPublicPastOpportunities({
      festivalId,
      page,
      appendResults,
      search,
    });
  }

  /**
   * GET /opportunity/search - Search matching events/hackathons + fetch top results.
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search opportunities (4 match hackathons, 4 match events, 8 top overall)',
  })
  async searchOpportunities(@Query('q') query: string) {
    return this.opportunityService.searchOpportunities(query || '');
  }
}
