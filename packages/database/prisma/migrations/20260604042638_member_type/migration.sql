/*
  Warnings:

  - The `role` column on the `community_member` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "community"."CommunityMemberRole" AS ENUM ('ADMIN', 'EDITOR', 'MEMBER');

-- AlterTable
ALTER TABLE "community"."community_member" DROP COLUMN "role",
ADD COLUMN     "role" "community"."CommunityMemberRole" NOT NULL DEFAULT 'MEMBER';

-- CreateTable
CREATE TABLE "community"."community_custom_roles" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "community_custom_roles_pkey" PRIMARY KEY ("id")
);
