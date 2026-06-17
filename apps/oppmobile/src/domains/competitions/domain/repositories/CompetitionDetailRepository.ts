import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';

export interface CompetitionDetailRepository {
  getDetail(id: string): Promise<OpportunityDetailModel>;
}
