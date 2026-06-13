-- AlterTable
ALTER TABLE "community"."community_post" ADD COLUMN     "skills" TEXT[] DEFAULT ARRAY[]::TEXT[];
