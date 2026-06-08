-- Owners must never be stored as page followers (legacy backfill edge case).
UPDATE "community"."community_member" AS cm
SET
  "role" = 'OWNER',
  "accessControlRole" = 'ADMIN'
FROM "community"."community" AS c
WHERE
  cm.community_id = c.id
  AND cm.user_id = c.owner_id
  AND cm."accessControlRole" = 'FOLLOWER';
