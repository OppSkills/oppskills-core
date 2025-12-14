-- =============================================
-- Festival refactor: Event -> Festival
-- =============================================

-- 1) Create lifecycle status enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills' AND t.typname = 'LifecycleStatus'
  ) THEN
    CREATE TYPE "oppskills"."LifecycleStatus" AS ENUM (
      'DRAFT',
      'PUBLISHED',
      'ONGOING',
      'COMPLETED',
      'CANCELLED'
    );
  END IF;
END $$;

-- 2) Registration form: remove event_id
ALTER TABLE "oppskills"."registration_form" DROP CONSTRAINT IF EXISTS "registration_form_event_id_fkey";
DROP INDEX IF EXISTS "oppskills"."registration_form_event_id_key";
ALTER TABLE "oppskills"."registration_form" DROP COLUMN IF EXISTS "event_id";

-- 3) Hackathon: ensure slug is non-null + add festival_id
ALTER TABLE "oppskills"."hackathon" ADD COLUMN IF NOT EXISTS "festival_id" TEXT;

UPDATE "oppskills"."hackathon"
SET "slug" = CONCAT('hackathon-', "id")
WHERE "slug" IS NULL OR BTRIM("slug") = '';

ALTER TABLE "oppskills"."hackathon" ALTER COLUMN "slug" SET NOT NULL;

-- Convert hackathon.status from PublishStatus -> LifecycleStatus
-- Mapping:
--   APPROVED -> PUBLISHED
--   REJECTED -> DRAFT
--   DRAFT/PUBLISHED -> same
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'oppskills'
      AND table_name = 'hackathon'
      AND column_name = 'status'
  ) THEN
    -- Drop existing default before changing type (prevents cast errors)
    ALTER TABLE "oppskills"."hackathon" ALTER COLUMN "status" DROP DEFAULT;

    ALTER TABLE "oppskills"."hackathon"
    ALTER COLUMN "status" TYPE "oppskills"."LifecycleStatus"
    USING (
      CASE ("status"::TEXT)
        WHEN 'PUBLISHED' THEN 'PUBLISHED'
        WHEN 'APPROVED' THEN 'PUBLISHED'
        WHEN 'REJECTED' THEN 'DRAFT'
        ELSE 'DRAFT'
      END
    )::"oppskills"."LifecycleStatus";

    -- Re-apply default after conversion
    ALTER TABLE "oppskills"."hackathon" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
  END IF;
END $$;

-- Drop old moderation columns on hackathon
ALTER TABLE "oppskills"."hackathon" DROP CONSTRAINT IF EXISTS "hackathon_reviewed_by_id_fkey";
ALTER TABLE "oppskills"."hackathon" DROP COLUMN IF EXISTS "published_at";
ALTER TABLE "oppskills"."hackathon" DROP COLUMN IF EXISTS "reviewed_at";
ALTER TABLE "oppskills"."hackathon" DROP COLUMN IF EXISTS "reviewed_by_id";
ALTER TABLE "oppskills"."hackathon" DROP COLUMN IF EXISTS "rejection_reason";

-- 4) Event table -> Festival table (rename + reshape)
DO $$
BEGIN
  IF to_regclass('oppskills.event') IS NOT NULL THEN
    ALTER TABLE "oppskills"."event" DROP CONSTRAINT IF EXISTS "event_hackathon_id_fkey";
    ALTER TABLE "oppskills"."event" DROP CONSTRAINT IF EXISTS "event_organizer_user_id_fkey";
    ALTER TABLE "oppskills"."event" DROP CONSTRAINT IF EXISTS "event_reviewed_by_id_fkey";

    ALTER TABLE "oppskills"."event" RENAME TO "festival";
  END IF;
END $$;

-- Slug must be NOT NULL
UPDATE "oppskills"."festival"
SET "slug" = CONCAT('festival-', "id")
WHERE "slug" IS NULL OR BTRIM("slug") = '';

ALTER TABLE "oppskills"."festival" ALTER COLUMN "slug" SET NOT NULL;

-- Rename organizer column
ALTER TABLE "oppskills"."festival" RENAME COLUMN "organizer_user_id" TO "organizer_id";

-- Convert festival.status from PublishStatus -> LifecycleStatus
ALTER TABLE "oppskills"."festival"
ALTER COLUMN "status" DROP DEFAULT,
ALTER COLUMN "status" TYPE "oppskills"."LifecycleStatus"
USING (
  CASE ("status"::TEXT)
    WHEN 'PUBLISHED' THEN 'PUBLISHED'
    WHEN 'APPROVED' THEN 'PUBLISHED'
    WHEN 'REJECTED' THEN 'DRAFT'
    ELSE 'DRAFT'
  END
)::"oppskills"."LifecycleStatus";

-- Re-apply default after conversion
ALTER TABLE "oppskills"."festival" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Drop festival columns that don't belong to festivals
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "hackathon_id";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "event_time";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "visibility";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "mode";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "external_registration_link";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "is_free";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "entry_fee_amount";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "currency";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "published_at";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "reviewed_at";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "reviewed_by_id";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "rejection_reason";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "impressions";
ALTER TABLE "oppskills"."festival" DROP COLUMN IF EXISTS "registration_count";

-- 5) Index/constraint renames (best-effort)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'oppskills' AND c.relname = 'event_slug_key'
  ) THEN
    ALTER INDEX "oppskills"."event_slug_key" RENAME TO "festival_slug_key";
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'oppskills' AND c.relname = 'event_hackathon_id_idx'
  ) THEN
    DROP INDEX "oppskills"."event_hackathon_id_idx";
  END IF;
END $$;

-- Ensure festival slug unique index exists
CREATE UNIQUE INDEX IF NOT EXISTS "festival_slug_key" ON "oppskills"."festival"("slug");

-- 6) Foreign keys
ALTER TABLE "oppskills"."festival"
  ADD CONSTRAINT "festival_organizer_id_fkey"
  FOREIGN KEY ("organizer_id") REFERENCES "oppskills"."user"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "oppskills"."hackathon"
  ADD CONSTRAINT "hackathon_festival_id_fkey"
  FOREIGN KEY ("festival_id") REFERENCES "oppskills"."festival"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "festival_organizer_id_idx" ON "oppskills"."festival"("organizer_id");
CREATE INDEX IF NOT EXISTS "hackathon_festival_id_idx" ON "oppskills"."hackathon"("festival_id");

-- 7) Drop old enums if unused
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills' AND t.typname = 'PublishStatus'
  ) THEN
    DROP TYPE "oppskills"."PublishStatus";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'oppskills' AND t.typname = 'HackathonStatus'
  ) THEN
    DROP TYPE "oppskills"."HackathonStatus";
  END IF;
END $$;

