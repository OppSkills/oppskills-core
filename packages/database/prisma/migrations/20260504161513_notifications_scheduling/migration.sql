-- CreateEnum
CREATE TYPE "oppskills"."NotificationStatus" AS ENUM ('DRAFT', 'QUEUED', 'PROCESSING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "oppskills"."ScheduleType" AS ENUM ('IMMEDIATELY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "oppskills"."LogLevel" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateTable
CREATE TABLE "oppskills"."notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT,
    "hackathon_id" TEXT,
    "content" TEXT NOT NULL,
    "schedule_type" "oppskills"."ScheduleType" NOT NULL DEFAULT 'IMMEDIATELY',
    "scheduled_at" TIMESTAMP(3),
    "status" "oppskills"."NotificationStatus" NOT NULL DEFAULT 'DRAFT',
    "total_recipients" INTEGER,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "last_processed_id" TEXT,
    "processing_by" TEXT,
    "processing_started_at" TIMESTAMP(3),
    "processing_heartbeat_at" TIMESTAMP(3),
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "expected_finish_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "dedupe_key" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."notification_logs" (
    "id" TEXT NOT NULL,
    "notification_id" TEXT NOT NULL,
    "level" "oppskills"."LogLevel" NOT NULL,
    "message" TEXT NOT NULL,
    "meta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notifications_dedupe_key_key" ON "oppskills"."notifications"("dedupe_key");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "oppskills"."notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_event_id_idx" ON "oppskills"."notifications"("event_id");

-- CreateIndex
CREATE INDEX "notifications_hackathon_id_idx" ON "oppskills"."notifications"("hackathon_id");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "oppskills"."notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_scheduled_at_idx" ON "oppskills"."notifications"("scheduled_at");

-- CreateIndex
CREATE INDEX "notification_logs_notification_id_idx" ON "oppskills"."notification_logs"("notification_id");

-- AddForeignKey
ALTER TABLE "oppskills"."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."notifications" ADD CONSTRAINT "notifications_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."notifications" ADD CONSTRAINT "notifications_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."notification_logs" ADD CONSTRAINT "notification_logs_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "oppskills"."notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
