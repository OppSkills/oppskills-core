import type { OpportunityDetailModel } from '../../../shared/types/opportunityDetail';

export const mockHackathonDetail: OpportunityDetailModel = {
  routeLabel: 'Detail / Hackathon',
  heroLabel: 'Hackathon',
  heroTitle: '48 Hour Build Sprint at IIT Delhi',
  hostName: 'OppSkills x IIT Delhi Innovation Cell',
  modeLabel: 'Hybrid',
  registrationDeadline: '18 Dec 2024',
  ctaLabel: 'Apply Your Team',
  keyInfo: [
    { id: 'team-size', label: 'Team Size', value: '3 to 5 members' },
    { id: 'entry-fee', label: 'Entry Fee', value: 'Free' },
    { id: 'location', label: 'Location', value: 'IIT Delhi + Remote' },
    { id: 'duration', label: 'Duration', value: '48 hours' },
  ],
  aboutParagraphs: [
    'This hackathon focuses on building practical products across AI, climate-tech, fintech, and student productivity.',
    'Teams ship a working prototype, present architecture decisions, and pitch an execution roadmap to judges.',
    'Phase 10 implementation keeps this detail route fully mock-driven while preserving backend-ready contracts.',
  ],
  eligibility: [
    'Open to all UG and PG students with valid college identity.',
    'Each team must include at least one member experienced with coding or product design.',
    'Cross-campus teams are allowed and encouraged for interdisciplinary outcomes.',
  ],
  rules: [
    'Teams must submit source code repository, demo video, and architecture note before deadline.',
    'Pre-built boilerplates are allowed, but core innovation must be implemented during event window.',
    'Plagiarism or policy violations result in immediate disqualification.',
  ],
  rounds: [
    {
      id: 'hackathon-round-1',
      stageLabel: 'Round 1',
      title: 'Problem Framing',
      timeline: '20 Dec 2024 - 21 Dec 2024',
      checkpoints: [
        'Teams submit challenge statement and solution direction.',
        'Mentors validate scope, novelty, and feasibility constraints.',
      ],
    },
    {
      id: 'hackathon-round-2',
      stageLabel: 'Round 2',
      title: 'Prototype Build',
      timeline: '21 Dec 2024 - 22 Dec 2024',
      checkpoints: [
        'Feature implementation, testing, and demo scenario preparation.',
        'Interim review checks product progress and technical depth.',
      ],
    },
    {
      id: 'hackathon-round-3',
      stageLabel: 'Round 3',
      title: 'Final Jury Presentation',
      timeline: '22 Dec 2024',
      checkpoints: [
        'Final demo with architecture walkthrough and impact narrative.',
        'Jury scores innovation, execution quality, and scalability.',
      ],
    },
  ],
  prizes: [
    {
      id: 'hackathon-prize-1',
      rankLabel: 'Winner',
      reward: 'Rs 75,000',
      bonusLabel: 'Certificate + Incubation Call',
    },
    {
      id: 'hackathon-prize-2',
      rankLabel: '1st Runner Up',
      reward: 'Rs 40,000',
      bonusLabel: 'Certificate + Credits',
    },
    {
      id: 'hackathon-prize-3',
      rankLabel: '2nd Runner Up',
      reward: 'Swags + Grant Support',
      bonusLabel: 'Certificate + Featured Listing',
    },
  ],
  contact: {
    organizerName: 'OppSkills Hackathons Program Team',
    phoneNumber: '+91 91234 56780',
    email: 'hackathons@oppskills.app',
    venue: 'IIT Delhi Research Park, Hybrid Arena',
  },
};