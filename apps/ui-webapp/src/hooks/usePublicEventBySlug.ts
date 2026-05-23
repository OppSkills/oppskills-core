import { useQuery } from "@tanstack/react-query";
import { getPublicEventBySlug } from "@/lib/api/eventApi";

/**
 * Public event data returned by the public slug endpoint.
 * NOTE: This is sanitized - no participants, no registrant emails, no role lists.
 */
export interface PublicEventDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  approvalStatus: string | null;
  locationType: string | null;
  locationCoords: string | null;
  locationAddress: string | null;
  locationVirtualLink: string | null;
  isFree: boolean;
  entryFeeAmount: number | null;
  currency: string;
  visibility: string;
  eventType: string | null;
  registrationCount: number;
  maxUsers: number | null;
  registrationDeadline: string | null;
  isRegistrationPaused: boolean;
  organizationName: string | null;
  organizationLogoUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  attendeeEligibility: string[];
  /**
   * Owner info - public endpoints only return first/last name and imageUrl.
   * Email is NOT exposed for privacy.
   */
  owner: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  festival: {
    id: string;
    name: string;
    slug: string;
  } | null;
  /**
   * NOTE: participants is NOT included in public responses to protect registrant PII.
   */
  attachments: Array<{
    id: string;
    storageKey: string;
    publicUrl: string | null;
    fileName: string | null;
    mimeType: string | null;
    sizeBytes: number | null;
  }>;
  registrationForm: {
    id: string;
    externalFormLink: string | null;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      required: boolean;
      order: number;
      options: string[];
      placeholder: string | null;
    }>;
  } | null;
  prizeBreakdown: Array<{
    id: string;
    position: string;
    amount: number;
    description: string | null;
  }>;
}

/**
 * Backwards compatibility alias.
 * @deprecated Use PublicEventDetail instead.
 */
export type EventDetail = PublicEventDetail;

/**
 * Normalizes slug input.
 */
function normalizeSlug(slug: string | null | undefined): string | null {
  if (typeof slug !== "string") return null;
  const trimmed = slug.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Query key for event by slug.
 */
export function getPublicEventBySlugQueryKey(slug: string | null) {
  return ["public-event-by-slug", slug] as const;
}

/**
 * Fetches a public event by slug (no auth required).
 * Used for the /events/[slug] detail page.
 */
export function usePublicEventBySlug(slug: string | null | undefined) {
  const safeSlug = normalizeSlug(slug);

  return useQuery<PublicEventDetail>({
    queryKey: getPublicEventBySlugQueryKey(safeSlug),
    enabled: safeSlug !== null,
    queryFn: async () => {
      if (safeSlug === null) {
        throw new Error("Event slug is required.");
      }
      const data = await getPublicEventBySlug(safeSlug);
      return data as PublicEventDetail;
    },
  });
}
