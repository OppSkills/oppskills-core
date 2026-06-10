-- AlterTable
ALTER TABLE "chat"."message_attachment"
ADD COLUMN "thumbnail_url" TEXT,
ADD COLUMN "duration_seconds" INTEGER;
