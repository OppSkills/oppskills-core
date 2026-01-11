-- AlterTable
ALTER TABLE "oppskills"."event" ADD COLUMN     "views" BIGINT NOT NULL DEFAULT 0,
ALTER COLUMN "impressions" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "oppskills"."hackathon" ADD COLUMN     "views" BIGINT NOT NULL DEFAULT 0,
ALTER COLUMN "impressions" SET DATA TYPE BIGINT;
