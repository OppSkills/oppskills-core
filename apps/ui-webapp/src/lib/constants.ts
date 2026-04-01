const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://oppskills.com";
const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.oppskills.com";

export const SITE_URL = rawSiteUrl.endsWith("/") ? rawSiteUrl.slice(0, -1) : rawSiteUrl;
export const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;
export const DOMAIN = "oppskills.com";
export const SUPPORT_EMAIL = "info@oppskills.com";
