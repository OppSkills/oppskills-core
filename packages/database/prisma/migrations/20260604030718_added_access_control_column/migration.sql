-- CreateEnum
CREATE TYPE "community"."CommunityAccessControlRole" AS ENUM ('ADMIN', 'READ_ONLY', 'MODERATOR');

-- AlterTable
ALTER TABLE "community"."community_member" ADD COLUMN     "accessControlRole" "community"."CommunityAccessControlRole" NOT NULL DEFAULT 'READ_ONLY',
ALTER COLUMN "role" SET DEFAULT 'MEMBER';
