import { Prisma } from '@prisma/client';
import { prisma } from '@oppskills/db';

export const COMMUNITY_NOTIFICATION_ROSTER = 'Community Roster';
export const COMMUNITY_NOTIFICATION_FOLLOWERS = 'Followers';
export const COMMUNITY_NOTIFICATION_INTERNAL_MEMBERS = 'Internal Members';

export function buildCommunityAudienceWhere(
  communityId: string,
  ownerId: string,
  audience?: string | null,
): Prisma.CommunityMemberEntityWhereInput {
  const where: Prisma.CommunityMemberEntityWhereInput = { communityId };

  const selected = audience?.trim();
  if (!selected || selected === COMMUNITY_NOTIFICATION_ROSTER) {
    // Community Roster = dashboard roster (internal team, not page followers)
    return {
      ...where,
      accessControlRole: { not: 'FOLLOWER' },
    };
  }

  if (selected === COMMUNITY_NOTIFICATION_FOLLOWERS) {
    return {
      ...where,
      accessControlRole: 'FOLLOWER',
      userId: { not: ownerId },
    };
  }

  if (selected === COMMUNITY_NOTIFICATION_INTERNAL_MEMBERS) {
    return {
      ...where,
      accessControlRole: { not: 'FOLLOWER' },
    };
  }

  return {
    ...where,
    role: { equals: selected, mode: 'insensitive' },
    accessControlRole: { not: 'FOLLOWER' },
  };
}

export async function countCommunityAudience(
  communityId: string,
  ownerId: string,
  audience?: string | null,
): Promise<number> {
  const hasOwnerInMembers = await prisma.communityMemberEntity
    .count({
      where: { communityId, userId: ownerId },
    })
    .then((count) => count > 0);

  const dbCount = await prisma.communityMemberEntity.count({
    where: buildCommunityAudienceWhere(communityId, ownerId, audience),
  });

  const isRoster =
    !audience?.trim() || audience.trim() === COMMUNITY_NOTIFICATION_ROSTER;
  const legacyOwnerBoost = isRoster && !hasOwnerInMembers ? 1 : 0;

  return dbCount + legacyOwnerBoost;
}
