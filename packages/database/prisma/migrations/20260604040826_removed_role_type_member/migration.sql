/*
  Warnings:

  - The `role` column on the `community_member` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "community"."community_member" DROP COLUMN "role",
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'MEMBER';

-- DropEnum
DROP TYPE "community"."CommunityMemberRole";
