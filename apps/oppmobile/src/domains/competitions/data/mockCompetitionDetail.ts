import type { OpportunityDetailModel } from '../../../shared/types/opportunityDetail';

export const mockCompetitionDetail: OpportunityDetailModel = {
  routeLabel: 'Competition Page',
  heroLabel: 'Competition',
  heroTitle: 'Silicon Valley Funding Summit at CES 2026 - VIP Access for Investors',
  aboutHeading: 'About Hackathon',
  hostName: 'FestName',
  modeLabel: 'Offline',
  registrationDeadline: 'Monday, 5 January 2026',
  ctaLabel: 'Next',
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
    'Round 1: Dashboard Thinking & Video Response Assessment. Participants receive the actual dataset and answer six analytical prompts about trends, visualization choices, and storytelling flow.',
    'Round 2: Dashboard Design & Insight Extraction. Shortlisted teams build a single-page dashboard with KPI summary, 4-6 core visuals, and a short PPT with top insights.',
    'Round 3: Presentation and Operational Recommendations (Finale). Finalists present on Zoom, justify design choices, explain trends, and propose practical operational recommendations.',
    'Judging Criteria: Insight Depth (40%), Visualization Quality (30%), Storytelling & Flow (20%), Actionability (10%).',
  ],
  eligibility: [
    'Engineering/BBA/BCA/MCA/BSc/BE/B.Com/MBA/M.Tech students are eligible.',
    'Team Size: 1-3 members per team.',
    'Event Format: Rounds 1 and 2 are online submissions; Round 3 is a live Zoom presentation.',
    'Participation is free.',
  ],
  rules: [
    'Dataset Adherence: Teams must strictly use the provided dataset.',
    'Originality: All work must be original. Plagiarism leads to disqualification.',
    'Tools: Power BI, Tableau, Excel, Python (Plotly/Matplotlib), and Google Looker Studio are allowed.',
    'Use of AI for content generation is prohibited; coding-assist AI tools are permitted only when disclosed.',
    'Presentation Time: Final presentations should be approx. 10-15 mins plus Q&A.',
    'Final Decision: The organizing committee decision is final and binding.',
    'Important Dates: Registration Deadline 18th Dec 11:59 PM; Round 1 Submission 21th Dec 11:59 PM; Round 2 and Round 3 dates to be announced.',
  ],
  rounds: [
    {
      id: 'competition-round-1',
      stageLabel: 'Completed',
      title: 'Dashboard Thinking & Video Response Assessment',
      timeline: '18 Dec 25, 12:00 PM IST - 20 Dec 25, 12:00 PM IST',
      checkpoints: [
        'Participants answer six analytical questions on trends, chart choices, and insight prioritization.',
        'Evaluation checks dataset understanding, clarity, and reasoning quality.',
      ],
    },
    {
      id: 'competition-round-2',
      stageLabel: 'Upcoming',
      title: 'Dashboard Design & Insight Extraction',
      timeline: '21 Dec 25, 12:00 PM IST - 23 Dec 25, 12:00 PM IST',
      checkpoints: [
        'Teams submit a dashboard file or link plus one short summary PPT.',
        'Evaluation focuses on structure, visualization fit, and depth of insight.',
      ],
    },
    {
      id: 'competition-round-3',
      stageLabel: 'Upcoming',
      title: 'Presentation and Operational Recommendations (Finale)',
      timeline: 'To Be Announced - To Be Announced',
      checkpoints: [
        'Finalists present live on Zoom with dashboard walkthrough and recommendation narrative.',
        'Judges assess strategic thinking, communication quality, and practical feasibility.',
      ],
    },
  ],
  prizes: [
    {
      id: 'competition-prize-1',
      rankLabel: 'Winner',
      reward: '₹ 5,000',
      bonusLabel: 'Appreciation Certificate',
    },
    {
      id: 'competition-prize-2',
      rankLabel: '1st Runner Up',
      reward: '₹ 5,000',
      bonusLabel: 'Appreciation Certificate',
    },
    {
      id: 'competition-prize-3',
      rankLabel: '2nd Runner Up',
      reward: 'Neckband + Swags',
      bonusLabel: 'Appreciation Certificate',
    },
    {
      id: 'competition-prize-4',
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