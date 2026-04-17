-- CreateEnum
CREATE TYPE "oppskills"."ReferralEntityType" AS ENUM ('HACKATHON', 'EVENT', 'FESTIVAL');

-- AlterTable
ALTER TABLE "oppskills"."event_participant" ADD COLUMN     "referral_id" TEXT;

-- AlterTable
ALTER TABLE "oppskills"."team" ADD COLUMN     "referral_id" TEXT;

-- AlterTable
ALTER TABLE "oppskills"."team_member" ADD COLUMN     "referral_id" TEXT;

-- CreateTable
CREATE TABLE "oppskills"."referral" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "entity_type" "oppskills"."ReferralEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "approved_by_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "clicks_count" INTEGER NOT NULL DEFAULT 0,
    "human_clicks_count" INTEGER NOT NULL DEFAULT 0,
    "registrations_count" INTEGER NOT NULL DEFAULT 0,
    "last_click_at" TIMESTAMP(3),
    "last_registration_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."referral_click" (
    "id" TEXT NOT NULL,
    "referral_id" TEXT NOT NULL,
    "ip_hash" TEXT NOT NULL,
    "user_agent_hash" TEXT NOT NULL,
    "source" TEXT,
    "is_bot" BOOLEAN NOT NULL DEFAULT false,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_click_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_code_key" ON "oppskills"."referral"("code");

-- CreateIndex
CREATE INDEX "referral_entity_type_entity_id_idx" ON "oppskills"."referral"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "referral_referrer_id_idx" ON "oppskills"."referral"("referrer_id");

-- CreateIndex
CREATE INDEX "referral_created_by_id_idx" ON "oppskills"."referral"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_entity_type_entity_id_referrer_id_key" ON "oppskills"."referral"("entity_type", "entity_id", "referrer_id");

-- CreateIndex
CREATE INDEX "referral_click_referral_id_clicked_at_idx" ON "oppskills"."referral_click"("referral_id", "clicked_at");

-- CreateIndex
CREATE INDEX "referral_click_clicked_at_idx" ON "oppskills"."referral_click"("clicked_at");

-- CreateIndex
CREATE INDEX "event_participant_referral_id_idx" ON "oppskills"."event_participant"("referral_id");

-- CreateIndex
CREATE INDEX "team_referral_id_idx" ON "oppskills"."team"("referral_id");

-- CreateIndex
CREATE INDEX "team_member_referral_id_idx" ON "oppskills"."team_member"("referral_id");

-- AddForeignKey
ALTER TABLE "oppskills"."event_participant" ADD CONSTRAINT "event_participant_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "oppskills"."referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."referral" ADD CONSTRAINT "referral_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."referral" ADD CONSTRAINT "referral_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."referral" ADD CONSTRAINT "referral_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."referral_click" ADD CONSTRAINT "referral_click_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "oppskills"."referral"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."team" ADD CONSTRAINT "team_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "oppskills"."referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."team_member" ADD CONSTRAINT "team_member_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "oppskills"."referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
