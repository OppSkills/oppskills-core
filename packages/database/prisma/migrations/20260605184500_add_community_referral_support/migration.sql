-- AlterEnum
ALTER TYPE "common"."ReferralEntityType" ADD VALUE 'COMMUNITY';

-- AlterTable
ALTER TABLE "community"."community_member" ADD COLUMN "referral_id" TEXT;

-- CreateIndex
CREATE INDEX "community_member_referral_id_idx" ON "community"."community_member"("referral_id");

-- AddForeignKey
ALTER TABLE "community"."community_member" ADD CONSTRAINT "community_member_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "common"."referral"("id") ON DELETE SET NULL ON UPDATE CASCADE;
