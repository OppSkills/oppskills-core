-- CreateEnum
CREATE TYPE "community"."interaction_type" AS ENUM ('LIKE', 'COMMENT', 'REPOST', 'SAVE', 'SHARE');

-- CreateTable
CREATE TABLE "community"."community_post_user_interaction" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "interaction_type" "community"."interaction_type" NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_user_interaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_post_user_interaction_user_id_skill_id_idx" ON "community"."community_post_user_interaction"("user_id", "skill_id");

-- AddForeignKey
ALTER TABLE "community"."community_post_user_interaction" ADD CONSTRAINT "community_post_user_interaction_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community"."community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_post_user_interaction" ADD CONSTRAINT "community_post_user_interaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_post_user_interaction" ADD CONSTRAINT "community_post_user_interaction_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "common"."skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
