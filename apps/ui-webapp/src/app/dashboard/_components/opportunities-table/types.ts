import { format, isAfter } from 'date-fns';
import { normalizeUrl } from "@/lib/utils";

export type OpportunityStatus = 'In Progress' | 'Completed' | 'Closed';
export type OpportunityType = 'Event' | 'Competition';

export interface Opportunity {
  id: string;
  slug: string;
  name: string;
  description: string;
  type: OpportunityType;
  image?: string | null;
  candidates: number;
  status: OpportunityStatus;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  registrationsOpen: boolean;
}

export function mapBackendToOpportunity(item: any, type: OpportunityType): Opportunity {
  const now = new Date();
  const deadline = item.registrationDeadline ? new Date(item.registrationDeadline) : null;
  
  // Logic from existing isRegistrationOpen
  const s = (item.status || "").toUpperCase();
  const approval = (item.approvalStatus || "").toUpperCase();
  const isRegistrationPaused = item.isRegistrationPaused === true;
  
  const isRegistrationOpen = 
    (s === "PUBLISHED" || s === "ONGOING") &&
    (approval === "APPROVED") &&
    !isRegistrationPaused &&
    (!deadline || isAfter(deadline, now));

  const mapStatus = (status: string): OpportunityStatus => {
    const s = status.toUpperCase();
    if (s === 'COMPLETED') return 'Completed';
    if (s === 'CANCELLED') return 'Closed';
    return 'In Progress';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : format(d, 'dd MMM yy');
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '—' : format(d, 'hh:mm a');
  };

  return {
    id: item.id,
    slug: item.slug || item.id,
    name: item.name,
    description: item.description || '',
    type,
    image: normalizeUrl(item.bannerImageUrl) || null,
    candidates: item.registrationCount || (Array.isArray(item.participants) ? item.participants.length : 0),
    status: mapStatus(item.status),
    startDate: formatDate(item.startDate),
    startTime: formatTime(item.startDate),
    endDate: formatDate(item.endDate),
    endTime: formatTime(item.endDate),
    registrationsOpen: isRegistrationOpen,
  };
}

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: '1',
    slug: 'green-tech-summit',
    name: 'Green Tech Summit',
    description: 'A platform for startups to showcase eco-friendly innovation',
    type: 'Event',
    image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?q=80&w=2070&auto=format&fit=crop',
    candidates: 2578,
    status: 'In Progress',
    startDate: '02 Oct 24',
    startTime: '07:00 PM IST',
    endDate: '14 Nov 24',
    endTime: '09:30 AM IST',
    registrationsOpen: true,
  },
  {
    id: '2',
    slug: 'code-clash',
    name: 'Code Clash',
    description: 'Competitive programming contest for university students',
    type: 'Competition',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop',
    candidates: 2578,
    status: 'In Progress',
    startDate: '26 Jan 25',
    startTime: '07:00 PM IST',
    endDate: '14 Nov 24',
    endTime: '09:30 AM IST',
    registrationsOpen: true,
  },
  {
    id: '3',
    slug: 'code-clash-2',
    name: 'Code Clash',
    description: 'Competitive programming contest for university students',
    type: 'Competition',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop',
    candidates: 2578,
    status: 'In Progress',
    startDate: '02 Oct 24',
    startTime: '07:00 PM IST',
    endDate: '14 Nov 24',
    endTime: '09:30 AM IST',
    registrationsOpen: false,
  },
  {
    id: '4',
    slug: 'code-clash-3',
    name: 'Code Clash',
    description: 'Competitive programming contest for university students',
    type: 'Competition',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop',
    candidates: 2578,
    status: 'Completed',
    startDate: '15 Aug 24',
    startTime: '07:00 PM IST',
    endDate: '15 Aug 24',
    endTime: '09:30 AM IST',
    registrationsOpen: false,
  },
  {
    id: '5',
    slug: 'code-clash-4',
    name: 'Code Clash',
    description: 'Competitive programming contest for university students',
    type: 'Competition',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop',
    candidates: 2578,
    status: 'Completed',
    startDate: '26 Jan 25',
    startTime: '07:00 PM IST',
    endDate: '26 Jan 25',
    endTime: '09:30 AM IST',
    registrationsOpen: false,
  },
  {
    id: '6',
    slug: 'code-clash-5',
    name: 'Code Clash',
    description: 'Competitive programming contest for university students',
    type: 'Competition',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop',
    candidates: 2578,
    status: 'Completed',
    startDate: '15 Aug 24',
    startTime: '07:00 PM IST',
    endDate: '02 Oct 24',
    endTime: '09:30 AM IST',
    registrationsOpen: false,
  },
];
