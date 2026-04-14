import { prisma } from '@oppskills/db';

/**
 * Persists a non-empty mobile from event/hackathon registration into the user's onboarding profile.
 */
export async function syncUserOnboardingMobileFromRegistration(
  userId: string,
  mobile: string,
): Promise<void> {
  const trimmed = mobile.trim();
  if (!trimmed) return;

  await prisma.userOnboardingProfileEntity.upsert({
    where: { userId },
    create: { userId, mobileNumber: trimmed },
    update: { mobileNumber: trimmed },
  });
}
