-- Persist custom member type labels on communities (independent of assigned members)
ALTER TABLE "community"."community"
ADD COLUMN "member_type_labels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
