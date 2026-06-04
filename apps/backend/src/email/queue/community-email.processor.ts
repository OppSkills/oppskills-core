import { prisma } from '@oppskills/db';
import { EmailService } from '../email.service';

export async function processCommunityEmailBatch(
  emailService: EmailService,
  communityId: string,
  userIds: string[],
) {
  const community = await prisma.communityEntity.findUnique({
    where: { id: communityId },
    select: { name: true, handle: true },
  });

  if (!community) return;

  const users = await prisma.userEntity.findMany({
    where: { id: { in: userIds } },
    select: { email: true, firstName: true },
  });

  const payload = await Promise.all(
    users.map(async (user) => {
      const { subject, html } = await emailService.renderEmail('community-welcome', {
        firstName: user.firstName || undefined,
        communityName: community.name,
        communityHandle: community.handle,
        baseUrl: process.env.FRONTEND_URL || 'https://oppskills.com',
      } as any);

      return {
        to: user.email,
        subject,
        html,
      };
    }),
  );

  if (payload.length > 0) {
    await emailService.sendBatch(payload);
  }
}
