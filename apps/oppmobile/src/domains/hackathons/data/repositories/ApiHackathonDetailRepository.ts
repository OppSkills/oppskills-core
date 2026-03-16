import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import type { HackathonDetailRepository } from '../../domain/repositories/HackathonDetailRepository';

export class ApiHackathonDetailRepository implements HackathonDetailRepository {
  async getDetail(): Promise<OpportunityDetailModel> {
    throw new Error('ApiHackathonDetailRepository is not active in Phase 11.');
  }
}
