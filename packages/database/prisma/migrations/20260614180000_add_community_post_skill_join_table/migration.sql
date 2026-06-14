-- CreateTable: community_post_skill join table replacing skills TEXT[] column
CREATE TABLE "community"."community_post_skill" (
    "post_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "community_post_skill_pkey" PRIMARY KEY ("post_id","skill_id")
);

-- CreateIndex
CREATE INDEX "community_post_skill_post_id_idx" ON "community"."community_post_skill"("post_id");

-- CreateIndex
CREATE INDEX "community_post_skill_skill_id_idx" ON "community"."community_post_skill"("skill_id");

-- AddForeignKey
ALTER TABLE "community"."community_post_skill" ADD CONSTRAINT "community_post_skill_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community"."community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_post_skill" ADD CONSTRAINT "community_post_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "common"."skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: add unique constraint to community_post_user_interaction (was missing before)
ALTER TABLE "community"."community_post_user_interaction" ADD CONSTRAINT "community_post_user_interaction_post_id_user_id_interaction_type_skill_id_key" UNIQUE ("post_id", "user_id", "interaction_type", "skill_id");

-- DropColumn: remove old skills text array (after migrating data if needed)
ALTER TABLE "community"."community_post" DROP COLUMN IF EXISTS "skills";
