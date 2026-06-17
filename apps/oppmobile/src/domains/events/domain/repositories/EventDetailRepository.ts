import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';

export interface EventDetailRepository {
  /** Fetch display-ready detail for a specific event by its backend UUID or slug. */
  getDetail(id: string): Promise<OpportunityDetailModel>;
}
