-- Track selected free ticket tier on team / member when no payment row exists.
ALTER TABLE "hackathon"."team"
ADD COLUMN "ticket_tier_id" TEXT;

CREATE INDEX "team_ticket_tier_id_idx" ON "hackathon"."team"("ticket_tier_id");

ALTER TABLE "hackathon"."team"
ADD CONSTRAINT "team_ticket_tier_id_fkey"
FOREIGN KEY ("ticket_tier_id") REFERENCES "payments"."ticket_tier"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hackathon"."team_member"
ADD COLUMN "ticket_tier_id" TEXT;

CREATE INDEX "team_member_ticket_tier_id_idx" ON "hackathon"."team_member"("ticket_tier_id");

ALTER TABLE "hackathon"."team_member"
ADD CONSTRAINT "team_member_ticket_tier_id_fkey"
FOREIGN KEY ("ticket_tier_id") REFERENCES "payments"."ticket_tier"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hackathon"."hackathon_registration_submission"
ADD COLUMN "ticket_tier_id" TEXT;

CREATE INDEX "hackathon_registration_submission_ticket_tier_id_idx"
ON "hackathon"."hackathon_registration_submission"("ticket_tier_id");

ALTER TABLE "hackathon"."hackathon_registration_submission"
ADD CONSTRAINT "hackathon_registration_submission_ticket_tier_id_fkey"
FOREIGN KEY ("ticket_tier_id") REFERENCES "payments"."ticket_tier"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
