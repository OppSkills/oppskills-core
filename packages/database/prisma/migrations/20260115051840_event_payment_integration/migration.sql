-- CreateEnum
CREATE TYPE "oppskills"."EventPaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "oppskills"."EventPaymentOrderStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- AlterTable
ALTER TABLE "oppskills"."event" ADD COLUMN     "free_college_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "oppskills"."event_payment" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "payer_user_id" TEXT NOT NULL,
    "participant_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gross_amount" DECIMAL(12,2) NOT NULL,
    "platform_fee_amount" DECIMAL(12,2) NOT NULL,
    "organizer_share_amount" DECIMAL(12,2) NOT NULL,
    "razorpay_order_id" TEXT NOT NULL,
    "razorpay_payment_id" TEXT,
    "razorpay_signature" TEXT,
    "razorpay_transfer_id" TEXT,
    "transfer_on_hold" BOOLEAN NOT NULL DEFAULT true,
    "transfer_on_hold_until" INTEGER,
    "transfer_status" TEXT,
    "settlement_status" TEXT,
    "order_status" "oppskills"."EventPaymentOrderStatus" NOT NULL DEFAULT 'CREATED',
    "payment_status" "oppskills"."EventPaymentStatus" NOT NULL DEFAULT 'CREATED',
    "discount_code_id" TEXT,
    "discount_amount" DECIMAL(12,2),
    "razorpay_refund_id" TEXT,
    "refund_status" "oppskills"."RefundStatus",
    "refunded_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "refunded_at" TIMESTAMP(3),
    "captured_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_discount_code" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "oppskills"."DiscountCodeType" NOT NULL,
    "value" DECIMAL(12,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "max_redemptions" INTEGER,
    "max_per_user" INTEGER NOT NULL DEFAULT 1,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_discount_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_discount_redemption" (
    "id" TEXT NOT NULL,
    "discount_code_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_discount_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_payout" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
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

    CONSTRAINT "event_payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_payout_item" (
    "id" TEXT NOT NULL,
    "payout_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "amount_allocated" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_payout_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_payment_participant_id_key" ON "oppskills"."event_payment"("participant_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_payment_razorpay_order_id_key" ON "oppskills"."event_payment"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_payment_razorpay_payment_id_key" ON "oppskills"."event_payment"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_payment_razorpay_refund_id_key" ON "oppskills"."event_payment"("razorpay_refund_id");

-- CreateIndex
CREATE INDEX "event_payment_event_id_idx" ON "oppskills"."event_payment"("event_id");

-- CreateIndex
CREATE INDEX "event_payment_organizer_id_idx" ON "oppskills"."event_payment"("organizer_id");

-- CreateIndex
CREATE INDEX "event_payment_payer_user_id_idx" ON "oppskills"."event_payment"("payer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_payment_event_id_payer_user_id_key" ON "oppskills"."event_payment"("event_id", "payer_user_id");

-- CreateIndex
CREATE INDEX "event_discount_code_event_id_idx" ON "oppskills"."event_discount_code"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_discount_code_event_id_code_key" ON "oppskills"."event_discount_code"("event_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "event_discount_redemption_payment_id_key" ON "oppskills"."event_discount_redemption"("payment_id");

-- CreateIndex
CREATE INDEX "event_discount_redemption_discount_code_id_idx" ON "oppskills"."event_discount_redemption"("discount_code_id");

-- CreateIndex
CREATE INDEX "event_discount_redemption_user_id_idx" ON "oppskills"."event_discount_redemption"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_discount_redemption_discount_code_id_user_id_key" ON "oppskills"."event_discount_redemption"("discount_code_id", "user_id");

-- CreateIndex
CREATE INDEX "event_payout_event_id_idx" ON "oppskills"."event_payout"("event_id");

-- CreateIndex
CREATE INDEX "event_payout_organizer_id_idx" ON "oppskills"."event_payout"("organizer_id");

-- CreateIndex
CREATE INDEX "event_payout_item_payout_id_idx" ON "oppskills"."event_payout_item"("payout_id");

-- CreateIndex
CREATE INDEX "event_payout_item_payment_id_idx" ON "oppskills"."event_payout_item"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_payout_item_payout_id_payment_id_key" ON "oppskills"."event_payout_item"("payout_id", "payment_id");

-- AddForeignKey
ALTER TABLE "oppskills"."event_payment" ADD CONSTRAINT "event_payment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payment" ADD CONSTRAINT "event_payment_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payment" ADD CONSTRAINT "event_payment_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payment" ADD CONSTRAINT "event_payment_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "oppskills"."event_participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payment" ADD CONSTRAINT "event_payment_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "oppskills"."event_discount_code"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_discount_code" ADD CONSTRAINT "event_discount_code_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_discount_redemption" ADD CONSTRAINT "event_discount_redemption_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "oppskills"."event_discount_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_discount_redemption" ADD CONSTRAINT "event_discount_redemption_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_discount_redemption" ADD CONSTRAINT "event_discount_redemption_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "oppskills"."event_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payout" ADD CONSTRAINT "event_payout_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payout" ADD CONSTRAINT "event_payout_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payout_item" ADD CONSTRAINT "event_payout_item_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "oppskills"."event_payout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payout_item" ADD CONSTRAINT "event_payout_item_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "oppskills"."event_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
