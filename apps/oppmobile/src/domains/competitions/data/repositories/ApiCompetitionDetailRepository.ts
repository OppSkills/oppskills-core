import { apiClient } from '../../../../shared/api/apiClient';
import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import type { CompetitionDetailRepository } from '../../domain/repositories/CompetitionDetailRepository';
import { mapPublicHackathonToDetail } from '../../../hackathons/data/mappers/mapHackathonDetail';
import type { PublicHackathonResponse } from '../../../hackathons/data/repositories/ApiHackathonDetailRepository';

export class ApiCompetitionDetailRepository implements CompetitionDetailRepository {
  async getDetail(id: string): Promise<OpportunityDetailModel> {
    const response = await apiClient.get<PublicHackathonResponse>(`/hackathons/public/${id}`);
    return mapPublicHackathonToDetail(response);
  }
}
