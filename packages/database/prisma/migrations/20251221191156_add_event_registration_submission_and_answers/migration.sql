-- CreateTable
CREATE TABLE "oppskills"."event_registration_submission" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "participant_id" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_registration_answer" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value_text" TEXT,
    "value_json" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_submission_participant_id_key" ON "oppskills"."event_registration_submission"("participant_id");

-- CreateIndex
CREATE INDEX "event_registration_submission_event_id_idx" ON "oppskills"."event_registration_submission"("event_id");

-- CreateIndex
CREATE INDEX "event_registration_submission_user_id_idx" ON "oppskills"."event_registration_submission"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_submission_event_id_user_id_key" ON "oppskills"."event_registration_submission"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "event_registration_answer_submission_id_idx" ON "oppskills"."event_registration_answer"("submission_id");

-- CreateIndex
CREATE INDEX "event_registration_answer_field_id_idx" ON "oppskills"."event_registration_answer"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_answer_submission_id_field_id_key" ON "oppskills"."event_registration_answer"("submission_id", "field_id");

-- AddForeignKey
ALTER TABLE "oppskills"."event_registration_submission" ADD CONSTRAINT "event_registration_submission_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_registration_submission" ADD CONSTRAINT "event_registration_submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_registration_submission" ADD CONSTRAINT "event_registration_submission_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "oppskills"."event_participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_registration_answer" ADD CONSTRAINT "event_registration_answer_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "oppskills"."event_registration_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_registration_answer" ADD CONSTRAINT "event_registration_answer_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "oppskills"."event_registration_field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
