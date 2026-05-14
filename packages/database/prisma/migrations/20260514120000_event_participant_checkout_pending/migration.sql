-- Paid event checkout: participant row + answers exist before Razorpay capture.
ALTER TABLE "oppskills"."event_participant" ADD COLUMN "checkout_pending" BOOLEAN NOT NULL DEFAULT false;
