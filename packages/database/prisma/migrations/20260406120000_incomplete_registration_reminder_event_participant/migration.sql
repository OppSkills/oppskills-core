-- Free-event incomplete registration reminders: rate-limit per participant row
ALTER TABLE "oppskills"."incomplete_registration_reminder_log"
ADD COLUMN "event_participant_id" TEXT;

CREATE UNIQUE INDEX "incomplete_registration_reminder_log_event_participant_id_key"
ON "oppskills"."incomplete_registration_reminder_log"("event_participant_id");

ALTER TABLE "oppskills"."incomplete_registration_reminder_log"
ADD CONSTRAINT "incomplete_registration_reminder_log_event_participant_id_fkey"
FOREIGN KEY ("event_participant_id") REFERENCES "oppskills"."event_participant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
