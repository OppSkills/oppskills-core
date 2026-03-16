export interface HomeCategoryChip {
  readonly id: string;
  readonly label: string;
}

export interface HomeOpportunityItem {
  readonly id: string;
  readonly title: string;
  readonly kind: 'Hackathon' | 'Competition' | 'Event';
  readonly host: string;
  readonly eventDate: string;
  readonly registerBy: string;
  readonly prizeLabel: string;
}

export interface HomeEventItem {
  readonly id: string;
  readonly title: string;
  readonly venue: string;
  readonly timing: string;
  readonly attendees: number;
}

export interface HomeCommunityItem {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly domain: string;
  readonly members: number;
  readonly registerBy: string;
}

export interface HomeHighlightItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
}

export interface HomeTrackItem {
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
}

export const homeCategoryChips: readonly HomeCategoryChip[] = [
  { id: 'hackathons', label: 'Hackathons' },
  { id: 'competitions', label: 'Competitions' },
  { id: 'events', label: 'Events' },
  { id: 'communities', label: 'Communities' },
];

export const topOpportunities: readonly HomeOpportunityItem[] = [
  {
    id: 'top-1',
    title: 'Hackathon Hackathon 1.0 on 1.0',
    kind: 'Hackathon',
    host: 'Kalinga Institute of Management',
    eventDate: '20 Mar 2026',
    registerBy: '20 Dec 2024',
    prizeLabel: 'Rs 20,000',
  },
  {
    id: 'top-2',
    title: 'Top 15 AI Skills You Need to Know in 2026',
    kind: 'Event',
    host: 'Kalinga Institute of Management',
    eventDate: '20 Mar 2026',
    registerBy: '20 Dec 2024',
    prizeLabel: 'Free',
  },
  {
    id: 'top-3',
    title: 'Treasure Hunt',
    kind: 'Competition',
    host: 'Kalinga Institute of Management',
    eventDate: '20 Mar 2026',
    registerBy: '20 Dec 2024',
    prizeLabel: 'Free',
  },
];

export const listedCompetitions: readonly HomeOpportunityItem[] = [
  {
    id: 'listed-1',
    title: 'Gully Cricket Tournament',
    kind: 'Hackathon',
    host: 'Kalinga Institute of Management',
    eventDate: '20 Dec 2024',
    registerBy: '20 Dec 2024',
    prizeLabel: 'Rs 20,000',
  },
  {
    id: 'listed-2',
    title: 'Public Speaking Championship',
    kind: 'Competition',
    host: 'Kalinga Institute of Management',
    eventDate: '20 Dec 2024',
    registerBy: '20 Dec 2024',
    prizeLabel: 'Rs 20,000',
  },
];

export const upcomingEvents: readonly HomeEventItem[] = [
  {
    id: 'event-1',
    title: 'Top 15 AI Skills You Need to Know in 2026',
    venue: 'Offline',
    timing: 'Every Tue | Dec 20 | 8:00 PM IST',
    attendees: 22,
  },
  {
    id: 'event-2',
    title: 'Masterclass in Conversational AI',
    venue: 'Online',
    timing: 'Sat | Dec 28 | 5:00 PM IST',
    attendees: 44,
  },
];

export const topCommunities: readonly HomeCommunityItem[] = [
  {
    id: 'community-1',
    name: 'HSK Developers',
    location: 'Hisar, Haryana',
    domain: 'Development',
    members: 22,
    registerBy: '20 Dec 2025',
  },
  {
    id: 'community-2',
    name: 'Designers Hub',
    location: 'Pune, Maharashtra',
    domain: 'Design',
    members: 36,
    registerBy: '24 Dec 2025',
  },
];

export const nearbyCommunities: readonly HomeCommunityItem[] = [
  {
    id: 'community-near-1',
    name: 'Campus Coders Circle',
    location: 'Noida, Uttar Pradesh',
    domain: 'Engineering',
    members: 54,
    registerBy: '18 Dec 2025',
  },
  {
    id: 'community-near-2',
    name: 'Product Sprint Club',
    location: 'Ghaziabad, Uttar Pradesh',
    domain: 'Product',
    members: 31,
    registerBy: '29 Dec 2025',
  },
];

export const howOppskillsWorks: readonly HomeHighlightItem[] = [
  {
    id: 'works-1',
    title: 'Cross-Campus Discovery',
    subtitle: 'Find opportunities beyond your college in one feed.',
  },
  {
    id: 'works-2',
    title: 'Transparent Details',
    subtitle: 'Deadlines, prizes, and requirements stay clear.',
  },
  {
    id: 'works-3',
    title: 'Quick Participation',
    subtitle: 'Register in minutes with one tap flows.',
  },
];

export const whyHustlersChooseOppskills: readonly HomeHighlightItem[] = [
  {
    id: 'why-1',
    title: 'Designed For Campus Life',
    subtitle: 'Simple, structured, and student-first mobile journeys.',
  },
  {
    id: 'why-2',
    title: 'Everything In One Place',
    subtitle: 'Stop searching across fragmented channels.',
  },
  {
    id: 'why-3',
    title: 'Active Student Communities',
    subtitle: 'Collaborate, compete, and grow together.',
  },
];

export const trustedByPartners: readonly string[] = [
  'IIT Hyderabad',
  'IIITD',
  'Sharda University',
  'Rishihood University',
  'IILM University',
];

export const upcomingTracks: readonly HomeTrackItem[] = [
  {
    id: 'track-1',
    title: 'Skill-Based Learning Tracks',
    subtitle: 'Curated pathways for coding, design, and analytics.',
  },
  {
    id: 'track-2',
    title: 'Mentor-Led Sessions',
    subtitle: 'Live sessions and interactive mentor support.',
  },
  {
    id: 'track-3',
    title: 'National-Level Challenges',
    subtitle: 'Large-scale competitions for real-world practice.',
  },
  {
    id: 'track-4',
    title: 'Creator and Organizer Tools',
    subtitle: 'Workflows that help clubs launch events faster.',
  },
];
