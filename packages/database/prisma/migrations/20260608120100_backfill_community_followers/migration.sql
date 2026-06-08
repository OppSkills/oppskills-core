-- Page follows were stored as READ_ONLY + role MEMBER; owner-added members use custom roles.
UPDATE "community"."community_member"
SET
  "accessControlRole" = 'FOLLOWER',
  "role" = 'FOLLOWER'
WHERE
  "accessControlRole" = 'READ_ONLY'
  AND "role" = 'MEMBER';
