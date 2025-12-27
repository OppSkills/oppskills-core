-- CreateEnum
CREATE TYPE "oppskills"."HackathonChargeMode" AS ENUM ('PER_TEAM', 'PER_USER');

-- CreateEnum
CREATE TYPE "oppskills"."RazorpayRouteStatus" AS ENUM ('CREATED', 'UNDER_REVIEW', 'NEEDS_CLARIFICATION', 'ACTIVATED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "oppskills"."HackathonPaymentScope" AS ENUM ('TEAM', 'USER');

-- CreateEnum
CREATE TYPE "oppskills"."HackathonPaymentStatus" AS ENUM ('CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "oppskills"."HackathonPaymentOrderStatus" AS ENUM ('CREATED', 'PAID', 'FAILED');

-- CreateEnum
CREATE TYPE "oppskills"."RefundStatus" AS ENUM ('CREATED', 'PROCESSED', 'FAILED');

-- CreateEnum
CREATE TYPE "oppskills"."DiscountCodeType" AS ENUM ('PERCENT', 'FIXED');

-- AlterTable
ALTER TABLE "oppskills"."hackathon" ADD COLUMN     "charge_mode" "oppskills"."HackathonChargeMode" NOT NULL DEFAULT 'PER_TEAM';

-- CreateTable
CREATE TABLE "oppskills"."razorpay_route_account" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "razorpay_account_id" TEXT NOT NULL,
    "route_product_id" TEXT,
    "status" "oppskills"."RazorpayRouteStatus" NOT NULL DEFAULT 'CREATED',
    "requirements" JSONB,
    "resolution_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "razorpay_route_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."hackathon_payment" (
    "id" TEXT NOT NULL,
    "scope" "oppskills"."HackathonPaymentScope" NOT NULL,
    "hackathon_id" TEXT NOT NULL,
    "organizer_id" TEXT NOT NULL,
    "payer_user_id" TEXT NOT NULL,
    "team_id" TEXT,
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
    "order_status" "oppskills"."HackathonPaymentOrderStatus" NOT NULL DEFAULT 'CREATED',
    "payment_status" "oppskills"."HackathonPaymentStatus" NOT NULL DEFAULT 'CREATED',
    "discount_code_id" TEXT,
    "discount_amount" DECIMAL(12,2),
    "razorpay_refund_id" TEXT,
    "refund_status" "oppskills"."RefundStatus",
    "refunded_at" TIMESTAMP(3),
    "captured_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."hackathon_discount_code" (
    "id" TEXT NOT NULL,
    "hackathon_id" TEXT NOT NULL,
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

    CONSTRAINT "hackathon_discount_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."hackathon_discount_redemption" (
    "id" TEXT NOT NULL,
    "discount_code_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "payment_id" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_discount_redemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."razorpay_webhook_event" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),

    CONSTRAINT "razorpay_webhook_event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_route_account_user_id_key" ON "oppskills"."razorpay_route_account"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_route_account_razorpay_account_id_key" ON "oppskills"."razorpay_route_account"("razorpay_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_payment_razorpay_order_id_key" ON "oppskills"."hackathon_payment"("razorpay_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_payment_razorpay_payment_id_key" ON "oppskills"."hackathon_payment"("razorpay_payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_payment_razorpay_refund_id_key" ON "oppskills"."hackathon_payment"("razorpay_refund_id");

-- CreateIndex
CREATE INDEX "hackathon_payment_hackathon_id_idx" ON "oppskills"."hackathon_payment"("hackathon_id");

-- CreateIndex
CREATE INDEX "hackathon_payment_organizer_id_idx" ON "oppskills"."hackathon_payment"("organizer_id");

-- CreateIndex
CREATE INDEX "hackathon_payment_payer_user_id_idx" ON "oppskills"."hackathon_payment"("payer_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_payment_scope_hackathon_id_team_id_key" ON "oppskills"."hackathon_payment"("scope", "hackathon_id", "team_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_payment_scope_hackathon_id_payer_user_id_key" ON "oppskills"."hackathon_payment"("scope", "hackathon_id", "payer_user_id");

-- CreateIndex
CREATE INDEX "hackathon_discount_code_hackathon_id_idx" ON "oppskills"."hackathon_discount_code"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_discount_code_hackathon_id_code_key" ON "oppskills"."hackathon_discount_code"("hackathon_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_discount_redemption_payment_id_key" ON "oppskills"."hackathon_discount_redemption"("payment_id");

-- CreateIndex
CREATE INDEX "hackathon_discount_redemption_discount_code_id_idx" ON "oppskills"."hackathon_discount_redemption"("discount_code_id");

-- CreateIndex
CREATE INDEX "hackathon_discount_redemption_user_id_idx" ON "oppskills"."hackathon_discount_redemption"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_discount_redemption_discount_code_id_user_id_key" ON "oppskills"."hackathon_discount_redemption"("discount_code_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "razorpay_webhook_event_event_id_key" ON "oppskills"."razorpay_webhook_event"("event_id");

-- AddForeignKey
ALTER TABLE "oppskills"."razorpay_route_account" ADD CONSTRAINT "razorpay_route_account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payment" ADD CONSTRAINT "hackathon_payment_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payment" ADD CONSTRAINT "hackathon_payment_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payment" ADD CONSTRAINT "hackathon_payment_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payment" ADD CONSTRAINT "hackathon_payment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "oppskills"."team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payment" ADD CONSTRAINT "hackathon_payment_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "oppskills"."hackathon_discount_code"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_discount_code" ADD CONSTRAINT "hackathon_discount_code_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_discount_redemption" ADD CONSTRAINT "hackathon_discount_redemption_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "oppskills"."hackathon_discount_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_discount_redemption" ADD CONSTRAINT "hackathon_discount_redemption_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_discount_redemption" ADD CONSTRAINT "hackathon_discount_redemption_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "oppskills"."hackathon_payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
