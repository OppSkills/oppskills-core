import type { OpportunityDetailModel } from '../../../shared/types/opportunityDetail';

export const mockHackathonDetail: OpportunityDetailModel = {
  routeLabel: 'Detail / Hackathon',
  heroLabel: 'Hackathon',
  heroTitle: 'Silicon Valley Funding Summit at CES 2026 - VIP Access for Investors',
  aboutHeading: 'About Hackathon',
  hostName: 'FestName',
  modeLabel: 'Offline',
  registrationDeadline: 'Monday, 5 January 2026',
  ctaLabel: 'Register Now',
  keyInfo: [
    { id: 'event-date', label: 'Event Date', value: 'Monday, 5 January 2026' },
    { id: 'event-time', label: 'Event Time', value: '8:00 - 20:00 GMT-8' },
    { id: 'location-name', label: 'Location Name', value: 'College/University Name' },
    { id: 'location-detail', label: 'Location Detail', value: 'City, State' },
    { id: 'team-size', label: 'Team Size', value: '1-2 Members' },
    { id: 'impressions', label: 'Impressions', value: '206' },
    { id: 'registration-window', label: 'Registration Deadline', value: '8 Days' },
  ],
  aboutParagraphs: [
    'Theme: Data Visualization Challenge - "Turning Raw Data Into Real Insights".',
    'Event Rounds: Round 1 is Dashboard Thinking & Video Response Assessment, Round 2 is Dashboard Design & Insight Extraction, and Round 3 is Presentation and Operational Recommendations (Finale).',
    'Rules and Guidelines include dataset adherence, originality, permitted tools, meeting etiquette, and final committee decision binding.',
    'Judging Criteria: Insight Depth (40%), Visualization Quality (30%), Storytelling & Flow (20%), and Actionability (10%).',
    'Important Dates: Registration Deadline 18th Dec 11:59 PM, Submission Deadline (Round 1) 21th Dec 11:59 PM, with later rounds to be announced.',
  ],
  eligibility: [
    'Engineering/BBA/BCA/MCA/BSc/BE/B. Com, MBA, and M. Tech students.',
    'Team Size: 1-3 members per team.',
    'Event Format: Rounds 1 & 2 are Online Submissions; Round 3 is a Live Presentation via Zoom.',
    'Participation is free.',
  ],
  rules: [
    'Dataset Adherence: Teams must strictly use the dataset provided.',
    'Originality: All work must be original. Plagiarism will lead to immediate disqualification.',
    'Use of AI for content generation is prohibited; AI tools for coding assistance are permitted if disclosed.',
    'Tools allowed: Power BI, Tableau, Excel, Python (Plotly/Matplotlib), Google Looker Studio.',
    'Presentation Time: Final presentations must not exceed the allotted time (approx. 10-15 mins + Q&A).',
    'If using Python/R, include preprocessing code file in the submission folder.',
  ],
  rounds: [
    {
      id: 'hackathon-round-1',
      stageLabel: 'Completed',
      title: 'Dashboard Thinking & Video Response Assessment',
      timeline: '18 Dec 25, 12:00 PM IST - 20 Dec 25, 12:00 PM IST',
      checkpoints: [
        'Participants answer six analytical prompts around trends, chart choices, and storytelling.',
        'Evaluation checks trend understanding, justification quality, and communication clarity.',
      ],
    },
    {
      id: 'hackathon-round-2',
      stageLabel: 'Upcoming',
      title: 'Dashboard Design & Insight Extraction',
      timeline: '21 Dec 25, 12:00 PM IST - 23 Dec 25, 12:00 PM IST',
      checkpoints: [
        'Teams submit dashboard file/link plus one short summary PPT.',
        'Evaluation focuses on structure, visualization appropriateness, and depth of insights.',
      ],
    },
    {
      id: 'hackathon-round-3',
      stageLabel: 'Upcoming',
      title: 'Presentation and Operational Recommendations (Finale)',
      timeline: 'To Be Announced - To Be Announced',
      checkpoints: [
        'Finalists present dashboard story and explain why identified trends matter.',
        'Judges score strategy, presentation quality, and actionability of recommendations.',
      ],
    },
  ],
  prizes: [
    {
      id: 'hackathon-prize-1',
      rankLabel: 'Winner',
      reward: '₹ 5,000',
      bonusLabel: 'Appreciation Certificate',
    },
    {
      id: 'hackathon-prize-2',
      rankLabel: '1st Runner Up',
      reward: '₹ 5,000',
      bonusLabel: 'Appreciation Certificate',
    },
    {
      id: 'hackathon-prize-3',
      rankLabel: '2nd Runner Up',
      reward: 'Neckband + Swags',
      bonusLabel: 'Appreciation Certificate',
    },
    {
      id: 'hackathon-prize-4',
      rankLabel: 'Participation',
      reward: 'Certificate',
      bonusLabel: 'Participation Certificate',
    },
  ],
  contact: {
    organizerName: 'Rohit',
    phoneNumber: '+91 99999 99999',
    email: 'tstrohittiwari@gmail.com',
    venue: 'College/University Name, City, State',
  },
};