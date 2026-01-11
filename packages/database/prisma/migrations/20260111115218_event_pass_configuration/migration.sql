-- CreateEnum
CREATE TYPE "oppskills"."PassSendingMode" AS ENUM ('IMMEDIATE', 'APPROVAL');

-- CreateEnum
CREATE TYPE "oppskills"."CollegeMatchMode" AS ENUM ('PROFILE_ONLY', 'EMAIL_ONLY', 'EITHER_OR', 'BOTH_REQUIRED');

-- AlterTable
ALTER TABLE "oppskills"."event" ADD COLUMN     "allowed_college_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "allowed_email_domains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "college_match_mode" "oppskills"."CollegeMatchMode" NOT NULL DEFAULT 'EITHER_OR',
ADD COLUMN     "college_restriction_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pass_sending_mode" "oppskills"."PassSendingMode" NOT NULL DEFAULT 'IMMEDIATE';

-- AlterTable
ALTER TABLE "oppskills"."event_participant" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by_id" TEXT,
ADD COLUMN     "pass_email_sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pass_email_sent_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "oppskills"."event_participant" ADD CONSTRAINT "event_participant_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
