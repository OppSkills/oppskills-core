-- Restricted meet audiences (roster, internal members, followers, custom roles)
ALTER TABLE "community"."community_meet"
ADD COLUMN "audience_filter" TEXT;

ALTER TABLE "community"."community_meet"
ALTER COLUMN "audience_scope" SET DEFAULT 'MEMBER_TYPES';
