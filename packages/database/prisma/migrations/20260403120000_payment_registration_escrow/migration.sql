-- CreateTable
CREATE TABLE "oppskills"."payment_registration_escrow" (
    "id" TEXT NOT NULL,
    "razorpay_order_id" TEXT NOT NULL,
    "payer_user_id" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "hackathon_id" TEXT,
    "event_id" TEXT,
    "answers" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_registration_escrow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_registration_escrow_razorpay_order_id_key" ON "oppskills"."payment_registration_escrow"("razorpay_order_id");

-- CreateIndex
CREATE INDEX "payment_registration_escrow_payer_user_id_idx" ON "oppskills"."payment_registration_escrow"("payer_user_id");

-- CreateIndex
CREATE INDEX "payment_registration_escrow_hackathon_id_idx" ON "oppskills"."payment_registration_escrow"("hackathon_id");

-- CreateIndex
CREATE INDEX "payment_registration_escrow_event_id_idx" ON "oppskills"."payment_registration_escrow"("event_id");

-- AddForeignKey
ALTER TABLE "oppskills"."payment_registration_escrow" ADD CONSTRAINT "payment_registration_escrow_payer_user_id_fkey" FOREIGN KEY ("payer_user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
