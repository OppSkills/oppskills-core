-- Add per-tier free flag for mixed paid/free registration on the same event/hackathon.
ALTER TABLE "payments"."ticket_tier"
ADD COLUMN "is_free" BOOLEAN NOT NULL DEFAULT false;

-- Existing zero-price tiers are treated as free.
UPDATE "payments"."ticket_tier"
SET "is_free" = true
WHERE "price" = 0;
