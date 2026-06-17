import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';

export interface HackathonDetailRepository {
  /** Fetch detail for a specific hackathon by its backend UUID. */
  getDetail(id: string): Promise<OpportunityDetailModel>;
}
