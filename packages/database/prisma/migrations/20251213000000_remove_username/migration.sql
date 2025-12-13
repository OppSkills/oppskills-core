-- Drop the username unique index (created by the initial migration)
DROP INDEX IF EXISTS "oppskills"."user_username_key";

-- Drop the redundant username column
ALTER TABLE "oppskills"."user" DROP COLUMN IF EXISTS "username";
