-- CreateTable
CREATE TABLE "oppskills"."event_pass" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "scanned_at" TIMESTAMP(3),
    "scanned_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_pass_ticket_id_key" ON "oppskills"."event_pass"("ticket_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_pass_token_key" ON "oppskills"."event_pass"("token");

-- CreateIndex
CREATE UNIQUE INDEX "event_pass_participant_id_key" ON "oppskills"."event_pass"("participant_id");

-- CreateIndex
CREATE INDEX "event_pass_user_id_idx" ON "oppskills"."event_pass"("user_id");

-- CreateIndex
CREATE INDEX "event_pass_event_id_idx" ON "oppskills"."event_pass"("event_id");

-- CreateIndex
CREATE INDEX "event_pass_participant_id_idx" ON "oppskills"."event_pass"("participant_id");

-- CreateIndex
CREATE INDEX "event_pass_token_idx" ON "oppskills"."event_pass"("token");

-- AddForeignKey
ALTER TABLE "oppskills"."event_pass" ADD CONSTRAINT "event_pass_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_pass" ADD CONSTRAINT "event_pass_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_pass" ADD CONSTRAINT "event_pass_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "oppskills"."event_participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_pass" ADD CONSTRAINT "event_pass_scanned_by_id_fkey" FOREIGN KEY ("scanned_by_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
