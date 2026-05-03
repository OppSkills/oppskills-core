/*
  Warnings:

  - Made the column `upi_id` on table `organizer_payout_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address1` on table `organizer_payout_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address2` on table `organizer_payout_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `city` on table `organizer_payout_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `pin_code` on table `organizer_payout_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `state` on table `organizer_payout_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `organizer_payout_details` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `organizer_payout_details` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "oppskills"."organizer_payout_details" ALTER COLUMN "upi_id" SET NOT NULL,
ALTER COLUMN "address1" SET NOT NULL,
ALTER COLUMN "address2" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "pin_code" SET NOT NULL,
ALTER COLUMN "state" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "email" DROP DEFAULT,
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "phone" DROP DEFAULT;
