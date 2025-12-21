-- CreateEnum
CREATE TYPE "oppskills"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "oppskills"."event" ADD COLUMN     "approval_approved_at" TIMESTAMP(3),
ADD COLUMN     "approval_note" TEXT,
ADD COLUMN     "approval_rejected_at" TIMESTAMP(3),
ADD COLUMN     "approval_status" "oppskills"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approval_submitted_at" TIMESTAMP(3),
ADD COLUMN     "is_registration_paused" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "oppskills"."festival" ADD COLUMN     "approval_approved_at" TIMESTAMP(3),
ADD COLUMN     "approval_note" TEXT,
ADD COLUMN     "approval_rejected_at" TIMESTAMP(3),
ADD COLUMN     "approval_status" "oppskills"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approval_submitted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "oppskills"."hackathon" ADD COLUMN     "approval_approved_at" TIMESTAMP(3),
ADD COLUMN     "approval_note" TEXT,
ADD COLUMN     "approval_rejected_at" TIMESTAMP(3),
ADD COLUMN     "approval_status" "oppskills"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approval_submitted_at" TIMESTAMP(3);
