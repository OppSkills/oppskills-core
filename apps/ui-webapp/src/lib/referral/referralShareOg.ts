import { API_URL, SITE_URL } from "@/lib/constants";
import { getPublicEventBySlug } from "@/lib/api/eventApi";
import { getPublicHackathonBySlug } from "@/lib/api/hackathonApi";
import { getFestivalBySlug } from "@/lib/api/festivalApi";
import { getPublicCommunityByHandle } from "@/lib/api/communityApi";
import { stripHtml } from "@/lib/utils";
import type { ReferralEntityType } from "@/lib/api/referralApi";

export type ReferralShareOg = {
  title: string;
  description: string;
  imageUrl: string;
};

function imageServeUrl(bannerUrl: string): string {
  return `${API_URL}/image/serve?url=${encodeURIComponent(bannerUrl)}`;
}

/** Escape text for use inside HTML double-quoted attributes. */
export function escapeHtmlAttr(raw: string): string {
  return raw
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\r?\n/g, " ");
}

/**
 * Load the same public fields used on /events/[slug], /hackathons/[slug], etc.
 * so referral links can render matching OG tags in a standalone HTML response.
 */
export async function fetchReferralTargetShareOg(
  entityType: ReferralEntityType,
  slug: string,
): Promise<ReferralShareOg | null> {
  try {
    if (entityType === "EVENT") {
      const event = (await getPublicEventBySlug(slug)) as Record<
        string,
        unknown
      > | null;
      if (!event) return null;
      const name = String(event.name ?? "Event");
      const description = event.description
        ? stripHtml(String(event.description)).slice(0, 160)
        : `Join ${name} at OppSkills.`;
      const banner = event.bannerImageUrl;
      const imageUrl =
        typeof banner === "string" && banner.length > 0
          ? imageServeUrl(banner)
          : `${SITE_URL}/og_poster.png`;
      return { title: name, description, imageUrl };
    }

    if (entityType === "HACKATHON") {
      const data = (await getPublicHackathonBySlug(slug)) as Record<
        string,
        unknown
      > | null;
      if (!data) return null;
      const name = String(data.name ?? "Hackathon");
      const description = data.description
        ? stripHtml(String(data.description)).slice(0, 160)
        : `Join ${name} on OppSkills.`;
      const banner = data.bannerImageUrl;
      const imageUrl =
        typeof banner === "string" && banner.length > 0
          ? imageServeUrl(banner)
          : `${SITE_URL}/og_poster.png`;
      return { title: `${name} | OppSkills`, description, imageUrl };
    }

    if (entityType === "FESTIVAL") {
      const f = (await getFestivalBySlug(null, slug)) as Record<
        string,
        unknown
      > | null;
      if (!f) return null;
      const name = String(f.name ?? "Festival");
      const description = f.description
        ? stripHtml(String(f.description)).slice(0, 160)
        : `Join ${name} on OppSkills.`;
      const banner = f.bannerImageUrl ?? f.bannerUrl ?? f.coverImageUrl;
      const imageUrl =
        typeof banner === "string" && banner.length > 0
          ? imageServeUrl(banner)
          : `${SITE_URL}/og_poster.png`;
      return { title: `${name} | OppSkills`, description, imageUrl };
    }

    if (entityType === "COMMUNITY") {
      const community = (await getPublicCommunityByHandle(
        slug,
      )) as unknown as Record<string, unknown> | null;
      if (!community) return null;
      const name = String(community.name ?? "Community");
      const description = `Join the ${name} community on OppSkills.`;
      const avatar = community.avatarImage;
      const cover = community.coverImage;
      const banner = avatar ?? cover;
      const imageUrl =
        typeof banner === "string" && banner.length > 0
          ? imageServeUrl(banner)
          : `${SITE_URL}/og_poster.png`;
      return { title: `${name} | OppSkills`, description, imageUrl };
    }

    return null;
  } catch {
    return null;
  }
}

export function buildReferralBridgeHtml(input: {
  og: ReferralShareOg;
  redirectTo: string;
  canonicalReferralUrl: string;
}): string {
  const { og, redirectTo, canonicalReferralUrl } = input;
  const title = escapeHtmlAttr(og.title);
  const description = escapeHtmlAttr(og.description);
  const image = escapeHtmlAttr(og.imageUrl);
  const dest = escapeHtmlAttr(redirectTo);
  const canon = escapeHtmlAttr(canonicalReferralUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <link rel="canonical" href="${canon}" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="OppSkills" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canon}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${dest}" />
</head>
<body>
  <p>Redirecting to <a href="${dest}">event page</a>…</p>
  <script>location.replace(${JSON.stringify(redirectTo)});</script>
</body>
</html>`;
}
