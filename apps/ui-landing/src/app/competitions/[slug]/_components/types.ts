export type RoundStatus = "completed" | "live" | "upcoming";

export interface Round {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: RoundStatus;
  submissionConfig?: {
    enabled?: boolean;
    requiresFileUpload?: boolean;
    allowedFileTypes?: string[];
    maxFileSizeBytes?: number;
    requiresLinkSubmission?: boolean;
    requiresDescription?: boolean;
    instructions?: string;
  };
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
  icon?: "trophy" | "medal" | "star";
}

export interface RegistrationField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  order: number;
  options: string[];
  placeholder: string | null;
}

export interface RegistrationForm {
  id: string;
  externalFormLink: string | null;
  fields: RegistrationField[];
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

  featuredIn?: string;
  specificDate?: string;
  specificTime?: string;
  venueName?: string;
  venueAddress?: string;
  teamSize?: string;
  impressions?: number;
  registrationDeadline?: string;

  participantType?: string;
  registrationForm?: RegistrationForm | null;
  isRegistrationPaused?: boolean;
  registrationDeadlineDate?: Date | null;
  maxTeams?: number | null;
  registrationCount?: number;
  isFree?: boolean;
  entryFeeAmount?: number | null;
  currency?: string;

  contact?: {
    name: string;
    email: string;
    phone: string;
  };

  createdAt: Date;
}
