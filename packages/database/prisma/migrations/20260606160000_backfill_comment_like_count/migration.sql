-- Reconcile comment like_count with actual like rows
UPDATE "community"."community_post_comment" AS c
SET "like_count" = COALESCE(sub.cnt, 0)
FROM (
  SELECT
    l."comment_id",
    COUNT(*)::int AS cnt
  FROM "community"."community_post_comment_like" AS l
  GROUP BY l."comment_id"
) AS sub
WHERE c."id" = sub."comment_id";

UPDATE "community"."community_post_comment"
SET "like_count" = 0
WHERE "id" NOT IN (
  SELECT "comment_id" FROM "community"."community_post_comment_like"
);
