-- AlterTable
ALTER TABLE "email_notifications"."notifications" ADD COLUMN "community_id" TEXT;

-- CreateIndex
CREATE INDEX "notifications_community_id_idx" ON "email_notifications"."notifications"("community_id");

-- AddForeignKey
ALTER TABLE "email_notifications"."notifications" ADD CONSTRAINT "notifications_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."community"("id") ON DELETE CASCADE ON UPDATE CASCADE;
