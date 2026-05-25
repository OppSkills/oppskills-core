-- Festival location: align with schema (location_city -> location_coords).
-- Idempotent: prod may already have location_coords and never had location_city.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'common'
      AND table_name = 'festival'
      AND column_name = 'location_city'
  ) THEN
    ALTER TABLE "common"."festival" DROP COLUMN "location_city";
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'common'
      AND table_name = 'festival'
      AND column_name = 'location_coords'
  ) THEN
    ALTER TABLE "common"."festival" ADD COLUMN "location_coords" TEXT;
  END IF;
END $$;
