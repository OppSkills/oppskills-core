import { withMockLatency } from '../../../../shared/data/mockLatency';
import { throwIfMockFailureEnabled } from '../../../../shared/data/mockFailure';
import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import type { CompetitionDetailRepository } from '../../domain/repositories/CompetitionDetailRepository';
import { mapCompetitionDetail } from '../mappers/mapCompetitionDetail';

export class MockCompetitionDetailRepository implements CompetitionDetailRepository {
  async getDetail(): Promise<OpportunityDetailModel> {
    await throwIfMockFailureEnabled('competition-detail', () => 'Mock competition detail failure.');
    return withMockLatency(mapCompetitionDetail());
  }
}
