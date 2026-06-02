/*
  Warnings:

  - You are about to drop the `community` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `community_member` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "community";

-- CreateEnum
CREATE TYPE "community"."Industry" AS ENUM ('TECHNOLOGY', 'EDUCATION', 'HEALTHCARE', 'FINANCE', 'ARTS_CULTURE', 'SPORTS_FITNESS', 'FOOD_BEVERAGE', 'TRAVEL', 'NONPROFIT', 'GOVERNMENT', 'RETAIL', 'MEDIA_ENTERTAINMENT', 'REAL_ESTATE', 'OTHER');

-- CreateEnum
CREATE TYPE "community"."CommunityMemberRole" AS ENUM ('ADMIN', 'EDITOR', 'MEMBER');

-- DropForeignKey
ALTER TABLE "user"."community" DROP CONSTRAINT "community_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "user"."community_member" DROP CONSTRAINT "community_member_community_id_fkey";

-- DropForeignKey
ALTER TABLE "user"."community_member" DROP CONSTRAINT "community_member_user_id_fkey";

-- DropTable
DROP TABLE "user"."community";

-- DropTable
DROP TABLE "user"."community_member";

-- DropEnum
DROP TYPE "user"."CommunityMemberRole";

-- DropEnum
DROP TYPE "user"."Industry";

-- CreateTable
CREATE TABLE "community"."community" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "industry" "community"."Industry" NOT NULL,
    "cover_image" TEXT,
    "avatar_image" TEXT,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_member" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "community"."CommunityMemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_handle_key" ON "community"."community"("handle");

-- CreateIndex
CREATE INDEX "community_owner_id_idx" ON "community"."community"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_name_owner_id_key" ON "community"."community"("name", "owner_id");

-- CreateIndex
CREATE INDEX "community_member_user_id_idx" ON "community"."community_member"("user_id");

-- CreateIndex
CREATE INDEX "community_member_community_id_idx" ON "community"."community_member"("community_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_member_community_id_user_id_key" ON "community"."community_member"("community_id", "user_id");

-- AddForeignKey
ALTER TABLE "community"."community" ADD CONSTRAINT "community_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_member" ADD CONSTRAINT "community_member_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_member" ADD CONSTRAINT "community_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
