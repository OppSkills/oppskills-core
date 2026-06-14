-- Safe, idempotent migration for community_post_skill join table
-- Uses IF NOT EXISTS / IF EXISTS throughout to be safe on partial re-runs

-- CreateTable
CREATE TABLE IF NOT EXISTS "community"."community_post_skill" (
    "post_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "community_post_skill_pkey" PRIMARY KEY ("post_id","skill_id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_skill_post_id_idx" ON "community"."community_post_skill"("post_id");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "community_post_skill_skill_id_idx" ON "community"."community_post_skill"("skill_id");

-- AddForeignKey (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_post_skill_post_id_fkey'
  ) THEN
    ALTER TABLE "community"."community_post_skill"
      ADD CONSTRAINT "community_post_skill_post_id_fkey"
      FOREIGN KEY ("post_id") REFERENCES "community"."community_post"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (skip if already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'community_post_skill_skill_id_fkey'
  ) THEN
    ALTER TABLE "community"."community_post_skill"
      ADD CONSTRAINT "community_post_skill_skill_id_fkey"
      FOREIGN KEY ("skill_id") REFERENCES "common"."skill"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Add unique constraint to community_post_user_interaction (short name, <=63 chars)
-- First remove duplicate rows to allow the constraint to be added safely
DELETE FROM "community"."community_post_user_interaction" a
  USING "community"."community_post_user_interaction" b
  WHERE a.id > b.id
    AND a.post_id = b.post_id
    AND a.user_id = b.user_id
    AND a.interaction_type = b.interaction_type
    AND a.skill_id = b.skill_id;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'cpu_interaction_unique'
  ) THEN
    ALTER TABLE "community"."community_post_user_interaction"
      ADD CONSTRAINT "cpu_interaction_unique"
      UNIQUE ("post_id", "user_id", "interaction_type", "skill_id");
  END IF;
END $$;

-- DropColumn: remove old skills text array
ALTER TABLE "community"."community_post" DROP COLUMN IF EXISTS "skills";
