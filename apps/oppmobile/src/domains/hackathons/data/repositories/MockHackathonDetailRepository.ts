import { withMockLatency } from '../../../../shared/data/mockLatency';
import { throwIfMockFailureEnabled } from '../../../../shared/data/mockFailure';
import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import type { HackathonDetailRepository } from '../../domain/repositories/HackathonDetailRepository';

const MOCK_HACKATHON_DETAIL: OpportunityDetailModel = {
  routeLabel: 'Detail / Hackathon',
  heroLabel: 'Hackathon',
  heroTitle: 'Mock Hackathon',
  aboutHeading: 'About',
  hostName: 'OppSkills',
  modeLabel: 'Online',
  registrationDeadline: '31 Dec 2025',
  ctaLabel: 'Register Free',
  keyInfo: [],
  aboutParagraphs: ['Mock description for local development.'],
  eligibility: ['Open to all participants.'],
  rules: [],
  rounds: [],
  prizes: [],
  contact: { organizerName: 'OppSkills', phoneNumber: '', email: '', venue: 'Online' },
};

export class MockHackathonDetailRepository implements HackathonDetailRepository {
  async getDetail(_id: string): Promise<OpportunityDetailModel> {
    await throwIfMockFailureEnabled('hackathon-detail', () => 'Mock hackathon detail failure.');
    return withMockLatency(MOCK_HACKATHON_DETAIL);
  }
}

