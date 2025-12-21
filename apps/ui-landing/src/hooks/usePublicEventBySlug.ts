import { useQuery } from "@tanstack/react-query";
import { getPublicEventBySlug } from "@/lib/api/eventApi";

/**
 * Detailed event data returned by the slug endpoint.
 */
export interface EventDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerImageUrl: string | null;
  startDate: string;
  endDate: string;
  status: string;
  locationType: string | null;
  locationCity: string | null;
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
  organizationName: string | null;
  organizationLogoUrl: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  attendeeEligibility: string[];
  owner: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  festival: {
    id: string;
    name: string;
    slug: string;
  } | null;
  participants: Array<{
    id: string;
    userId: string;
    createdAt: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
  }>;
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

  return useQuery<EventDetail>({
    queryKey: getPublicEventBySlugQueryKey(safeSlug),
    enabled: safeSlug !== null,
    queryFn: async () => {
      if (safeSlug === null) {
        throw new Error("Event slug is required.");
      }
      const data = await getPublicEventBySlug(safeSlug);
      return data as EventDetail;
    },
  });
}
