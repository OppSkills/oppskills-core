-- Owners must never be stored as page followers (legacy backfill edge case).
UPDATE "community"."community_member" AS cm
SET
  "role" = 'OWNER',
  "accessControlRole" = 'ADMIN'
FROM "community"."community" AS c
WHERE
  cm."communityId" = c.id
  AND cm."userId" = c."ownerId"
  AND cm."accessControlRole" = 'FOLLOWER';
