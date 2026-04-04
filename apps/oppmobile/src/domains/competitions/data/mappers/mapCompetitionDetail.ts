import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import { mockCompetitionDetail } from '../mockCompetitionDetail';

export function mapCompetitionDetail(): OpportunityDetailModel {
  const supplementarySections = mockCompetitionDetail.supplementarySections?.map((section) => ({
    ...section,
    points: [...section.points],
  }));

  return {
    ...mockCompetitionDetail,
    keyInfo: [...mockCompetitionDetail.keyInfo],
    aboutParagraphs: [...mockCompetitionDetail.aboutParagraphs],
    eligibility: [...mockCompetitionDetail.eligibility],
    rules: [...mockCompetitionDetail.rules],
    rounds: [...mockCompetitionDetail.rounds],
    prizes: [...mockCompetitionDetail.prizes],
    contact: { ...mockCompetitionDetail.contact },
    ...(supplementarySections ? { supplementarySections } : {}),
  };
}
