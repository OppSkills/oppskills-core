/*
  Warnings:

  - Added the required column `bank_name` to the `organizer_payout_details` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "oppskills"."organizer_payout_details" ADD COLUMN     "address1" TEXT,
ADD COLUMN     "address2" TEXT,
ADD COLUMN     "bank_name" TEXT NOT NULL,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "pan_number" TEXT,
ADD COLUMN     "pin_code" TEXT,
ADD COLUMN     "state" TEXT;

-- AlterTable
ALTER TABLE "oppskills"."team_member" ADD COLUMN     "scanned_at" TIMESTAMP(3);
