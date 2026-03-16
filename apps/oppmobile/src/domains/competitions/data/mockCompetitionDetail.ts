import type { OpportunityDetailModel } from '../../../shared/types/opportunityDetail';

export const mockCompetitionDetail: OpportunityDetailModel = {
  routeLabel: 'Detail / Competition',
  heroLabel: 'Competition',
  heroTitle: 'Silicon Valley Funding Summit at CES 2026',
  hostName: 'Kalinga Institute of Management',
  modeLabel: 'Offline',
  registrationDeadline: '20 Dec 2024',
  ctaLabel: 'Register For Free',
  keyInfo: [
    { id: 'team-size', label: 'Team Size', value: '2 to 5 members' },
    { id: 'entry-fee', label: 'Entry Fee', value: 'Free' },
    { id: 'location', label: 'Location', value: 'Bangalore, India' },
    { id: 'duration', label: 'Duration', value: '48 hours' },
  ],
  aboutParagraphs: [
    'The Silicon Valley Funding Summit at CES 2026 is a cross-campus opportunity focused on real startup storytelling and investor readiness.',
    'Participants pitch product ideas, validate business models, and defend implementation trade-offs before an expert panel.',
    'The screen is designed to remain backend-ready, with all content currently sourced from typed local mock data.',
  ],
  eligibility: [
    'Open to undergraduate and postgraduate students from any recognized institution.',
    'Solo and team participation are both allowed with a maximum of 5 members per team.',
    'At least one team member must be available for in-person final presentation.',
  ],
  rules: [
    'All submissions must be original and must not violate third-party copyrights.',
    'Teams can update submissions until the final deadline shown in the timeline.',
    'Judges decisions are final and based on idea clarity, feasibility, and communication quality.',
  ],
  rounds: [
    {
      id: 'competition-round-1',
      stageLabel: 'Round 1',
      title: 'Idea Screening',
      timeline: '20 Dec 2024 - 22 Dec 2024',
      checkpoints: [
        'Submit a 2-minute concept video and concise one-page summary.',
        'Shortlisting is based on originality, clarity, and market potential.',
      ],
    },
    {
      id: 'competition-round-2',
      stageLabel: 'Round 2',
      title: 'Mentor Review',
      timeline: '23 Dec 2024 - 26 Dec 2024',
      checkpoints: [
        'Teams receive mentor feedback and refine their investor deck.',
        'A mock Q and A session validates business assumptions.',
      ],
    },
    {
      id: 'competition-round-3',
      stageLabel: 'Round 3',
      title: 'Grand Finale',
      timeline: '28 Dec 2024',
      checkpoints: [
        'Final 5-minute pitch followed by panel questions.',
        'Top entries are ranked for prizes and internship opportunities.',
      ],
    },
  ],
  prizes: [
    {
      id: 'competition-prize-1',
      rankLabel: 'Winner',
      reward: 'Rs 50,000',
      bonusLabel: 'Certificate + Mentor Access',
    },
    {
      id: 'competition-prize-2',
      rankLabel: '1st Runner Up',
      reward: 'Rs 25,000',
      bonusLabel: 'Certificate + Community Spotlight',
    },
    {
      id: 'competition-prize-3',
      rankLabel: '2nd Runner Up',
      reward: 'Rs 10,000',
      bonusLabel: 'Certificate + Swag Kit',
    },
  ],
  contact: {
    organizerName: 'OppSkills Campus Competitions Desk',
    phoneNumber: '+91 98765 43210',
    email: 'competitions@oppskills.app',
    venue: 'Karnataka Convention Hub, Hall B',
  },
};