/**
 * Utility functions shared between Events and Hackathons.
 */

/**
 * Get deterministic pseudo-impressions based on registration count and creation date.
 * This provides a consistent engagement metric across the platform.
 */
export function getDeterministicPseudoImpressions(
  registrationCount: number | null | undefined,
  createdAt: string | Date | undefined
): number {
  if (!registrationCount || registrationCount <= 0) return 0;
  if (!createdAt) return registrationCount * 2; // Simple fallback

  const now = Date.now();
  const createdTime = new Date(createdAt).getTime();

  const hoursOld = Math.max(
    1,
    Math.floor((now - createdTime) / (1000 * 60 * 60))
  );

  const registrationBase = registrationCount * 6;

  let timeExposure = 0;

  if (hoursOld <= 24) {
    timeExposure = hoursOld * 35;
  } else if (hoursOld <= 72) {
    timeExposure = 24 * 35 + (hoursOld - 24) * 12;
  } else {
    timeExposure = 24 * 35 + 48 * 12 + Math.log2(hoursOld - 72 + 1) * 25;
  }

  const softCap = registrationCount * 120;

  const impressions = registrationBase + timeExposure;
  const finalCount = Math.min(Math.floor(impressions), softCap);
  return finalCount;
}
