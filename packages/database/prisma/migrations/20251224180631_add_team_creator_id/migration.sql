/*
  Adds creator_id column to team table.
  Backfills existing rows using leaderId before setting NOT NULL constraint.
*/

-- Step 1: Add column as nullable first
ALTER TABLE "oppskills"."team" ADD COLUMN "creator_id" TEXT;

-- Step 2: Backfill existing rows - set creator_id to leaderId for all existing teams
UPDATE "oppskills"."team" SET "creator_id" = "leaderId" WHERE "creator_id" IS NULL;

-- Step 3: Now set NOT NULL constraint
ALTER TABLE "oppskills"."team" ALTER COLUMN "creator_id" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "oppskills"."team" ADD CONSTRAINT "team_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
