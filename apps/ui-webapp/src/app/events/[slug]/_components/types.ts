export interface Ticket {
  id: string;
  name: string;
  price: number;
  description: string;
}

export interface Speaker {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
}

export interface Organizer {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

export interface EventDetails {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;

  // Sidebar Info
  date: string;
  time: string;
  venueName: string;
  venueAddress: string;
  startDate?: string | Date;
  endDate?: string | Date;

  // Registration
  tickets: Ticket[];

  // Stats & Additional Info
  registrationCount?: number;
  createdAt?: string | Date;
  festival?: {
    id: string;
    name: string;
    slug: string;
  };
  registrationDeadline?: string | Date;
  currency?: string;
  teamSize?: string;
  impressions?: number;
  isFree?: boolean;
  entryFeeAmount?: number | null;
  feeBearer?: "ORGANISER" | "PARTICIPANT";
  ticketTiers?: any[];

  // Tab Content
  about: string; // HTML string
  contact: {
    email: string;
    phone: string;
    website?: string;
  };
  speakers: Speaker[];
  organizers: Organizer[];
}
