// src/domains/hackathons/data/repositories/ApiHackathonDetailRepository.ts
// Fetches hackathon detail from GET /hackathons/public/:id (no auth required).
// Maps the backend Prisma response shape to OpportunityDetailModel.

import { apiClient } from '../../../../shared/api/apiClient';
import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import type { HackathonDetailRepository } from '../../domain/repositories/HackathonDetailRepository';
import { mapPublicHackathonToDetail } from '../mappers/mapHackathonDetail';

// ─── Backend Response Shape (inferred from hackathon.service.ts Prisma select) ─
export interface PublicHackathonResponse {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  approvalStatus: string;
  mode: string;
  locationType: string | null;
  locationCity: string | null;
  locationAddress: string | null;
  locationVirtualLink: string | null;
  isFree: boolean;
  entryFeeAmount: number | null;
  currency: string;
  chargeMode?: string | null;
  prizeTotalWorthAmount: number | null;
  prizeDescription: unknown | null;
  prizeCertificate: boolean;
  visibility: string;
  hackathonType: string;
  participantType: string;
  registrationCount: number;
  maxTeams: number | null;
  registrationDeadline: string | null;
  isRegistrationPaused: boolean;
  organizationName: string | null;
  organizationLogoUrl: string | null;
  attendeeEligibility: string[];
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  views: number;
  impressions: number;
  createdAt: string;
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  festival: { id: string; name: string; slug: string } | null;
  rounds: Array<{
    id: string;
    name: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    order: number;
    roundType: string;
    status: string;
    submissionConfig: unknown | null;
  }>;
  prizeBreakdown: Array<{
    id: string;
    position: number;
    amount: number;
    description: string | null;
  }>;
  registrationForm: {
    id: string;
    externalFormLink: string | null;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      options: string[];
    }>;
  } | null;
  attachments: Array<{
    id: string;
    fileName: string;
    publicUrl: string;
    mimeType: string;
    sizeBytes: number;
  }>;
}

export class ApiHackathonDetailRepository implements HackathonDetailRepository {
  async getDetail(id: string): Promise<OpportunityDetailModel> {
    const response = await apiClient.get<PublicHackathonResponse>(
      `/hackathons/public/${id}`,
    );
    return mapPublicHackathonToDetail(response);
  }
}
