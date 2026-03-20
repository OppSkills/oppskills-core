import { withMockLatency } from '../../../../shared/data/mockLatency';
import { throwIfMockFailureEnabled } from '../../../../shared/data/mockFailure';
import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import type { HackathonDetailRepository } from '../../domain/repositories/HackathonDetailRepository';
import { mapHackathonDetail } from '../mappers/mapHackathonDetail';

export class MockHackathonDetailRepository implements HackathonDetailRepository {
  async getDetail(): Promise<OpportunityDetailModel> {
    await throwIfMockFailureEnabled('hackathon-detail', () => 'Mock hackathon detail failure.');
    return withMockLatency(mapHackathonDetail());
  }
}
