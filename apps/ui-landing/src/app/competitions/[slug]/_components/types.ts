
export type RoundStatus = 'completed' | 'live' | 'upcoming';

export interface Round {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: RoundStatus;
}

export interface Organizer {
  id: string;
  name: string;
  role: string;
  avatar: string;
  linkedin?: string;
  company?: string;
}

export interface Prize {
  id: string;
  title: string;
  amount: string;
  description: string;
  icon?: 'trophy' | 'medal' | 'star';
}

export interface CompetitionDetails {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  location: string;
  dateRange: string;
  tags: string[];
  about: string;
  rounds: Round[];
  organizers: Organizer[];
  prizes: Prize[];
  
  // New fields for sidebar
  featuredIn?: string;
  specificDate?: string;
  specificTime?: string;
  venueName?: string;
  venueAddress?: string;
  teamSize?: string;
  impressions?: number;
  registrationDeadline?: string;
}
