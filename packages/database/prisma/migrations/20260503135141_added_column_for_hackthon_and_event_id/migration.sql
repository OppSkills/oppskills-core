/*
  Warnings:

  - A unique constraint covering the columns `[event_id]` on the table `organizer_payout_details` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[hackathon_id]` on the table `organizer_payout_details` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "oppskills"."organizer_payout_details_user_id_key";

-- AlterTable
ALTER TABLE "oppskills"."organizer_payout_details" ADD COLUMN     "event_id" TEXT,
ADD COLUMN     "hackathon_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "organizer_payout_details_event_id_key" ON "oppskills"."organizer_payout_details"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "organizer_payout_details_hackathon_id_key" ON "oppskills"."organizer_payout_details"("hackathon_id");

-- CreateIndex
CREATE INDEX "organizer_payout_details_user_id_idx" ON "oppskills"."organizer_payout_details"("user_id");

-- CreateIndex
CREATE INDEX "organizer_payout_details_event_id_idx" ON "oppskills"."organizer_payout_details"("event_id");

-- CreateIndex
CREATE INDEX "organizer_payout_details_hackathon_id_idx" ON "oppskills"."organizer_payout_details"("hackathon_id");

-- AddForeignKey
ALTER TABLE "oppskills"."organizer_payout_details" ADD CONSTRAINT "organizer_payout_details_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."organizer_payout_details" ADD CONSTRAINT "organizer_payout_details_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
