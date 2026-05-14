-- AlterTable
ALTER TABLE "oppskills"."event_payment" ADD COLUMN     "ticket_tier_id" TEXT;

-- AlterTable
ALTER TABLE "oppskills"."hackathon_payment" ADD COLUMN     "ticket_tier_id" TEXT;

-- CreateTable
CREATE TABLE "oppskills"."ticket_tier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "capacity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "event_id" TEXT,
    "hackathon_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_tier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_tier_event_id_idx" ON "oppskills"."ticket_tier"("event_id");

-- CreateIndex
CREATE INDEX "ticket_tier_hackathon_id_idx" ON "oppskills"."ticket_tier"("hackathon_id");

-- CreateIndex
CREATE INDEX "event_payment_ticket_tier_id_idx" ON "oppskills"."event_payment"("ticket_tier_id");

-- CreateIndex
CREATE INDEX "hackathon_payment_ticket_tier_id_idx" ON "oppskills"."hackathon_payment"("ticket_tier_id");

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_payment" ADD CONSTRAINT "hackathon_payment_ticket_tier_id_fkey" FOREIGN KEY ("ticket_tier_id") REFERENCES "oppskills"."ticket_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_payment" ADD CONSTRAINT "event_payment_ticket_tier_id_fkey" FOREIGN KEY ("ticket_tier_id") REFERENCES "oppskills"."ticket_tier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."ticket_tier" ADD CONSTRAINT "ticket_tier_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."ticket_tier" ADD CONSTRAINT "ticket_tier_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
