-- Throttle incomplete-registration reminder emails per payment row.

CREATE TABLE "oppskills"."incomplete_registration_reminder_log" (
    "id" TEXT NOT NULL,
    "hackathon_payment_id" TEXT,
    "event_payment_id" TEXT,
    "last_sent_at" TIMESTAMP(3) NOT NULL,
    "sent_count" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incomplete_registration_reminder_log_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "incomplete_registration_reminder_log_hackathon_payment_id_key" ON "oppskills"."incomplete_registration_reminder_log"("hackathon_payment_id");

CREATE UNIQUE INDEX "incomplete_registration_reminder_log_event_payment_id_key" ON "oppskills"."incomplete_registration_reminder_log"("event_payment_id");

CREATE INDEX "incomplete_registration_reminder_log_last_sent_at_idx" ON "oppskills"."incomplete_registration_reminder_log"("last_sent_at");

ALTER TABLE "oppskills"."incomplete_registration_reminder_log" ADD CONSTRAINT "incomplete_registration_reminder_log_hackathon_payment_id_fkey" FOREIGN KEY ("hackathon_payment_id") REFERENCES "oppskills"."hackathon_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "oppskills"."incomplete_registration_reminder_log" ADD CONSTRAINT "incomplete_registration_reminder_log_event_payment_id_fkey" FOREIGN KEY ("event_payment_id") REFERENCES "oppskills"."event_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
