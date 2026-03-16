import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';

export interface HackathonDetailRepository {
  getDetail(): Promise<OpportunityDetailModel>;
}
