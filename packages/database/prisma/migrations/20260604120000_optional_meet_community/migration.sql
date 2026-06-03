-- Allow personal meets without a community association.
ALTER TABLE "community"."community_meet" ALTER COLUMN "community_id" DROP NOT NULL;
