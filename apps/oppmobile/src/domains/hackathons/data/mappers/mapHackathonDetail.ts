import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import { mockHackathonDetail } from '../mockHackathonDetail';

export function mapHackathonDetail(): OpportunityDetailModel {
  return {
    ...mockHackathonDetail,
    keyInfo: [...mockHackathonDetail.keyInfo],
    aboutParagraphs: [...mockHackathonDetail.aboutParagraphs],
    eligibility: [...mockHackathonDetail.eligibility],
    rules: [...mockHackathonDetail.rules],
    rounds: [...mockHackathonDetail.rounds],
    prizes: [...mockHackathonDetail.prizes],
    contact: { ...mockHackathonDetail.contact },
  };
}
