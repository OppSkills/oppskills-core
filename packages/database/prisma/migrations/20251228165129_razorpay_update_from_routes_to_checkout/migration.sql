-- CreateEnum
CREATE TYPE "oppskills"."PayoutStatus" AS ENUM ('PAID');

-- AlterTable
ALTER TABLE "oppskills"."hackathon_payment" ADD COLUMN     "refunded_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "oppskills"."organizer_payout_details" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_holder_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc" TEXT NOT NULL,
    "upi_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizer_payout_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."hackathon_payout" (
    "id" TEXT NOT NULL,
    "hackathon_id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "status" "oppskills"."PayoutStatus" NOT NULL DEFAULT 'PAID',
    "eligible_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "reference" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."hackathon_payout_item" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount_allocated" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_payout_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizer_payout_details_user_id_key" ON "oppskills"."organizer_payout_details"("user_id");

-- CreateIndex
CREATE INDEX "hackathon_payout_hackathon_id_idx" ON "oppskills"."hackathon_payout"("hackathon_id");

-- CreateIndex
CREATE INDEX "hackathon_payout_organizer_id_idx" ON "oppskills"."hackathon_payout"("organizer_id");

-- CreateIndex
CREATE INDEX "hackathon_payout_item_payout_id_idx" ON "oppskills"."hackathon_payout_item"("payout_id");

-- CreateIndex
CREATE INDEX "hackathon_payout_item_payment_id_idx" ON "oppskills"."hackathon_payout_item"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_payout_item_payout_id_payment_id_key" ON "oppskills"."hackathon_payout_item"("payout_id", "payment_id");

-- AddForeignKey
ALTER TABLE "oppskills"."organizer_payout_details" ADD CONSTRAINT "organizer_payout_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payout" ADD CONSTRAINT "hackathon_payout_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payout" ADD CONSTRAINT "hackathon_payout_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payout_item" ADD CONSTRAINT "hackathon_payout_item_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "oppskills"."hackathon_payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payout_item" ADD CONSTRAINT "hackathon_payout_item_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "oppskills"."hackathon_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
