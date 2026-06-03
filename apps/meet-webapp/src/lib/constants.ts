const rawMeetSiteUrl =
  process.env.NEXT_PUBLIC_MEET_BASE_URL || "https://meet.oppskills.com";

export const MEET_SITE_URL = rawMeetSiteUrl.endsWith("/")
  ? rawMeetSiteUrl.slice(0, -1)
  : rawMeetSiteUrl;

export const MAIN_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://oppskills.com"
).replace(/\/+$/, "");
