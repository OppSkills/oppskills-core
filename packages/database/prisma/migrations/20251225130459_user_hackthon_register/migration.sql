/*
  Warnings:

  - A unique constraint covering the columns `[invitation_code]` on the table `team` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "oppskills"."team" ADD COLUMN     "invitation_code" TEXT,
ADD COLUMN     "is_open" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "oppskills"."hackathon_registration_submission" (
    "id" TEXT NOT NULL,
    "hackathon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "team_member_id" TEXT,
    "is_leader" BOOLEAN NOT NULL DEFAULT false,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_registration_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."hackathon_registration_answer" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "value_text" TEXT,
    "value_json" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_registration_answer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_registration_submission_team_member_id_key" ON "oppskills"."hackathon_registration_submission"("team_member_id");

-- CreateIndex
CREATE INDEX "hackathon_registration_submission_hackathon_id_idx" ON "oppskills"."hackathon_registration_submission"("hackathon_id");

-- CreateIndex
CREATE INDEX "hackathon_registration_submission_user_id_idx" ON "oppskills"."hackathon_registration_submission"("user_id");

-- CreateIndex
CREATE INDEX "hackathon_registration_submission_team_id_idx" ON "oppskills"."hackathon_registration_submission"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_registration_submission_hackathon_id_user_id_key" ON "oppskills"."hackathon_registration_submission"("hackathon_id", "user_id");

-- CreateIndex
CREATE INDEX "hackathon_registration_answer_submission_id_idx" ON "oppskills"."hackathon_registration_answer"("submission_id");

-- CreateIndex
CREATE INDEX "hackathon_registration_answer_field_id_idx" ON "oppskills"."hackathon_registration_answer"("field_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_registration_answer_submission_id_field_id_key" ON "oppskills"."hackathon_registration_answer"("submission_id", "field_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_invitation_code_key" ON "oppskills"."team"("invitation_code");

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_registration_submission" ADD CONSTRAINT "hackathon_registration_submission_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_registration_submission" ADD CONSTRAINT "hackathon_registration_submission_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_registration_submission" ADD CONSTRAINT "hackathon_registration_submission_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "oppskills"."team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_registration_submission" ADD CONSTRAINT "hackathon_registration_submission_team_member_id_fkey" FOREIGN KEY ("team_member_id") REFERENCES "oppskills"."team_member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_registration_answer" ADD CONSTRAINT "hackathon_registration_answer_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "oppskills"."hackathon_registration_submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_registration_answer" ADD CONSTRAINT "hackathon_registration_answer_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "oppskills"."registration_field"("id") ON DELETE CASCADE ON UPDATE CASCADE;
