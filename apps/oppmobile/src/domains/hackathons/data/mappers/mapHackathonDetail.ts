// src/domains/hackathons/data/mappers/mapHackathonDetail.ts
// Maps the backend PublicHackathonResponse → OpportunityDetailModel (the UI contract).
// This keeps all data transformation in one place — screens never see raw API shapes.

import type { OpportunityDetailModel } from '../../../../shared/types/opportunityDetail';
import type { PublicHackathonResponse } from '../repositories/ApiHackathonDetailRepository';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return 'TBA';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(isoString: string | null | undefined): string {
  if (!isoString) return 'TBA';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'TBA';
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).toUpperCase();
}

function formatDeadline(isoString: string | null | undefined): string {
  if (!isoString) return 'No deadline';
  return formatDate(isoString);
}

function formatTeamSize(participantType: string): string {
  const map: Record<string, string> = {
    INDIVIDUAL: '1 Member',
    TEAM_OF_2: '2 Members',
    TEAM_OF_3: '3 Members',
    TEAM_OF_4: '4 Members',
    TEAM_OF_5: '5 Members',
    TEAM_OF_6: '6 Members',
    MORE_THAN_6: '7+ Members',
    TEAM_OF_2_3: '2–3 Members',
    TEAM_OF_2_4: '2–4 Members',
    TEAM_OF_3_4: '3–4 Members',
    TEAM_OF_3_5: '3–5 Members',
    TEAM_OF_4_5: '4–5 Members',
    TEAM_OF_4_6: '4–6 Members',
    TEAM_OF_5_6: '5–6 Members',
  };
  return map[participantType] ?? '1–4 Members';
}

function formatMode(mode: string, locationType: string | null): string {
  if (locationType === 'VIRTUAL' || mode === 'ONLINE') return 'Online';
  if (locationType === 'HYBRID' || mode === 'HYBRID') return 'Hybrid';
  return 'Offline';
}

function formatPrize(
  isFree: boolean,
  prizeTotalWorthAmount: number | null,
  currency: string,
): string {
  if (prizeTotalWorthAmount && prizeTotalWorthAmount > 0) {
    return `${currency === 'INR' ? '₹' : currency} ${prizeTotalWorthAmount.toLocaleString('en-IN')}`;
  }
  return isFree ? 'Certificate' : 'Prizes';
}

function rankLabel(position: number): string {
  if (position === 1) return 'Winner';
  if (position === 2) return '1st Runner Up';
  if (position === 3) return '2nd Runner Up';
  return `${position}th Place`;
}

function deadlineDaysLeft(isoString: string | null | undefined): string {
  if (!isoString) return 'Open';
  const diff = new Date(isoString).getTime() - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return 'Closed';
  if (days === 0) return 'Today';
  return `${days} Day${days === 1 ? '' : 's'}`;
}

// ─── Mapper ───────────────────────────────────────────────────────────────────

export function mapPublicHackathonToDetail(
  h: PublicHackathonResponse,
): OpportunityDetailModel {
  const modeLabel = formatMode(h.mode, h.locationType ?? null);
  const locationDisplay = [h.locationCity, h.locationAddress].filter(Boolean).join(', ');

  return {
    slug: h.slug,
    routeLabel: 'Detail / Hackathon',
    heroLabel: 'Hackathon',
    heroTitle: h.name,
    bannerImageUrl: h.bannerImageUrl ?? undefined,
    aboutHeading: 'About Hackathon',
    hostName: h.organizationName ?? h.owner.firstName ?? 'OppSkills',
    modeLabel,
    registrationDeadline: formatDeadline(h.registrationDeadline),
    ctaLabel: 'Register Now',

    keyInfo: [
      { id: 'event-date', label: 'Event Date', value: formatDate(h.startDate) },
      { id: 'event-time', label: 'Event Time', value: formatTime(h.startDate) },
      { id: 'end-date', label: 'Event End Date', value: formatDate(h.endDate) },
      { id: 'location-name', label: 'Location', value: locationDisplay || modeLabel },
      { id: 'team-size', label: 'Team Size', value: formatTeamSize(h.participantType) },
      { id: 'impressions', label: 'Impressions', value: String(h.impressions) },
      ...(h.registrationStartDate
        ? [{ id: 'registration-start', label: 'Registration Starts', value: formatDate(h.registrationStartDate) }]
        : []),
      {
        id: 'registration-window',
        label: 'Registration Deadline',
        value: deadlineDaysLeft(h.registrationDeadline),
      },
      ...(h.maxTeams
        ? [{ id: 'max-teams', label: 'Max Teams', value: String(h.maxTeams) }]
        : []),
    ],

    aboutParagraphs: h.description
      ? h.description.split('\n').filter((p) => p.trim().length > 0)
      : ['No description provided.'],

    eligibility: h.attendeeEligibility.length > 0
      ? h.attendeeEligibility.map((e) =>
          e
            .replace(/_/g, ' ')
            .toLowerCase()
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        )
      : ['Open to all participants.'],

    rules: [],

    rounds: h.rounds.map((r) => ({
      id: r.id,
      stageLabel: r.status === 'COMPLETED' ? 'Completed' : 'Upcoming',
      title: r.name,
      timeline: `${formatDate(r.startsAt)} – ${formatDate(r.endsAt)}`,
      checkpoints: r.description
        ? r.description.split('\n').filter((l) => l.trim().length > 0)
        : [],
    })),

    prizes: [
      ...h.prizeBreakdown.map((p) => ({
        id: p.id,
        rankLabel: rankLabel(p.position),
        reward: `₹ ${p.amount.toLocaleString('en-IN')}`,
        bonusLabel: p.description ?? 'Appreciation Certificate',
      })),
      ...(h.prizeCertificate && h.prizeBreakdown.length === 0
        ? [
            {
              id: 'cert',
              rankLabel: 'Participation',
              reward: 'Certificate',
              bonusLabel: 'Participation Certificate',
            },
          ]
        : []),
    ],

    contact: {
      organizerName: h.contactName ?? h.owner.firstName ?? 'Organizer',
      phoneNumber: h.contactPhone ?? '',
      email: h.contactEmail ?? '',
      venue: locationDisplay || (h.locationVirtualLink ? 'Online Event' : modeLabel),
    },
    attachments: h.attachments?.map((a) => ({
      id: a.id,
      name: a.fileName,
      url: a.publicUrl,
    })) ?? [],

    // Optional prize summary for display
    ...(h.prizeTotalWorthAmount
      ? {
          supplementarySections: [
            {
              id: 'prize-pool',
              title: 'Total Prize Pool',
              points: [formatPrize(h.isFree, h.prizeTotalWorthAmount, h.currency)],
            },
          ],
        }
      : {}),
  };
}
