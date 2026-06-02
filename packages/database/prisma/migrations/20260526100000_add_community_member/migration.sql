-- CreateEnum
CREATE TYPE "user"."CommunityMemberRole" AS ENUM ('ADMIN', 'EDITOR', 'MEMBER');

-- CreateTable
CREATE TABLE "user"."community_member" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "user"."CommunityMemberRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_member_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_member_community_id_user_id_key" ON "user"."community_member"("community_id", "user_id");

-- CreateIndex
CREATE INDEX "community_member_user_id_idx" ON "user"."community_member"("user_id");

-- CreateIndex
CREATE INDEX "community_member_community_id_idx" ON "user"."community_member"("community_id");

-- AddForeignKey
ALTER TABLE "user"."community_member" ADD CONSTRAINT "community_member_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "user"."community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user"."community_member" ADD CONSTRAINT "community_member_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: owner is ADMIN member for existing communities
INSERT INTO "user"."community_member" ("id", "community_id", "user_id", "role", "created_at", "updated_at")
SELECT gen_random_uuid()::text, c."id", c."owner_id", 'ADMIN'::"user"."CommunityMemberRole", c."created_at", c."updated_at"
FROM "user"."community" c
WHERE NOT EXISTS (
    SELECT 1 FROM "user"."community_member" m
    WHERE m."community_id" = c."id" AND m."user_id" = c."owner_id"
);
