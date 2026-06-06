-- Backfill comment_count to include all comments (top-level + replies)
UPDATE "community"."community_post" AS p
SET "comment_count" = sub.cnt
FROM (
  SELECT
    c."post_id",
    COUNT(*)::int AS cnt
  FROM "community"."community_post_comment" AS c
  WHERE c."status" = 'PUBLISHED'
  GROUP BY c."post_id"
) AS sub
WHERE p."id" = sub."post_id";
