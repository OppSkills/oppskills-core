import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';

export interface CompetitionDetailRepository {
  getDetail(): Promise<OpportunityDetailModel>;
}
