import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import type { CompetitionDetailRepository } from '../../domain/repositories/CompetitionDetailRepository';

export class ApiCompetitionDetailRepository implements CompetitionDetailRepository {
  async getDetail(): Promise<OpportunityDetailModel> {
    throw new Error('ApiCompetitionDetailRepository is not active in Phase 11.');
  }
}
