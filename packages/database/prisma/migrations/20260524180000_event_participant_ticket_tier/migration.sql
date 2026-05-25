-- Track selected free ticket tier on participant when no payment row exists.
ALTER TABLE "events"."event_participant"
ADD COLUMN "ticket_tier_id" TEXT;

CREATE INDEX "event_participant_ticket_tier_id_idx"
ON "events"."event_participant"("ticket_tier_id");

ALTER TABLE "events"."event_participant"
ADD CONSTRAINT "event_participant_ticket_tier_id_fkey"
FOREIGN KEY ("ticket_tier_id") REFERENCES "payments"."ticket_tier"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
