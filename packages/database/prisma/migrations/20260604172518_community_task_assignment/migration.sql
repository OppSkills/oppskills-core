/*
  Warnings:

  - You are about to drop the `community_custom_roles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "community"."TaskThreadMessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateEnum
CREATE TYPE "community"."TaskPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "community"."TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- DropTable
DROP TABLE "community"."community_custom_roles";

-- CreateTable
CREATE TABLE "community"."community_task" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "to_user_id" TEXT NOT NULL,
    "by_user_id" TEXT NOT NULL,
    "priority" "community"."TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "community"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "tags" TEXT[],
    "opt_for_mail" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_task_thread_message" (
    "id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "community"."TaskThreadMessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "file_name" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_task_thread_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_task_community_id_idx" ON "community"."community_task"("community_id");

-- CreateIndex
CREATE INDEX "community_task_to_user_id_idx" ON "community"."community_task"("to_user_id");

-- CreateIndex
CREATE INDEX "community_task_by_user_id_idx" ON "community"."community_task"("by_user_id");

-- CreateIndex
CREATE INDEX "community_task_status_idx" ON "community"."community_task"("status");

-- CreateIndex
CREATE INDEX "community_task_thread_message_task_id_idx" ON "community"."community_task_thread_message"("task_id");

-- CreateIndex
CREATE INDEX "community_task_thread_message_user_id_idx" ON "community"."community_task_thread_message"("user_id");

-- AddForeignKey
ALTER TABLE "community"."community_task" ADD CONSTRAINT "community_task_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_task" ADD CONSTRAINT "community_task_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "user"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_task" ADD CONSTRAINT "community_task_by_user_id_fkey" FOREIGN KEY ("by_user_id") REFERENCES "user"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_task_thread_message" ADD CONSTRAINT "community_task_thread_message_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "community"."community_task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_task_thread_message" ADD CONSTRAINT "community_task_thread_message_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
