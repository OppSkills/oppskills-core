-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "chat";

-- CreateEnum
CREATE TYPE "chat"."ConversationType" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "chat"."MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "chat"."AttachmentKind" AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT');

-- CreateTable
CREATE TABLE "chat"."conversation" (
    "id" TEXT NOT NULL,
    "type" "chat"."ConversationType" NOT NULL,
    "name" TEXT,
    "handle" TEXT,
    "image_url" TEXT,
    "created_by_id" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."conversation_participant" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_read_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."conversation_direct_key" (
    "id" TEXT NOT NULL,
    "user_low_id" TEXT NOT NULL,
    "user_high_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,

    CONSTRAINT "conversation_direct_key_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "type" "chat"."MessageType" NOT NULL DEFAULT 'TEXT',
    "body" TEXT,
    "reply_to_message_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."message_attachment" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER,
    "url" TEXT NOT NULL,
    "kind" "chat"."AttachmentKind" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat"."message_delivery" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "delivered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_delivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_handle_key" ON "chat"."conversation"("handle");

-- CreateIndex
CREATE INDEX "conversation_last_message_at_idx" ON "chat"."conversation"("last_message_at" DESC);

-- CreateIndex
CREATE INDEX "conversation_created_by_id_idx" ON "chat"."conversation"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_participant_conversation_id_user_id_key" ON "chat"."conversation_participant"("conversation_id", "user_id");

-- CreateIndex
CREATE INDEX "conversation_participant_user_id_idx" ON "chat"."conversation_participant"("user_id");

-- CreateIndex
CREATE INDEX "conversation_participant_conversation_id_idx" ON "chat"."conversation_participant"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_direct_key_user_low_id_user_high_id_key" ON "chat"."conversation_direct_key"("user_low_id", "user_high_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_direct_key_conversation_id_key" ON "chat"."conversation_direct_key"("conversation_id");

-- CreateIndex
CREATE INDEX "message_conversation_id_created_at_idx" ON "chat"."message"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "message_sender_id_idx" ON "chat"."message"("sender_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_attachment_message_id_key" ON "chat"."message_attachment"("message_id");

-- CreateIndex
CREATE INDEX "message_attachment_message_id_idx" ON "chat"."message_attachment"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_delivery_message_id_user_id_key" ON "chat"."message_delivery"("message_id", "user_id");

-- CreateIndex
CREATE INDEX "message_delivery_message_id_idx" ON "chat"."message_delivery"("message_id");

-- CreateIndex
CREATE INDEX "message_delivery_user_id_idx" ON "chat"."message_delivery"("user_id");

-- AddForeignKey
ALTER TABLE "chat"."conversation" ADD CONSTRAINT "conversation_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."conversation_participant" ADD CONSTRAINT "conversation_participant_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat"."conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."conversation_participant" ADD CONSTRAINT "conversation_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."conversation_direct_key" ADD CONSTRAINT "conversation_direct_key_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat"."conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."message" ADD CONSTRAINT "message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "chat"."conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."message" ADD CONSTRAINT "message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."message" ADD CONSTRAINT "message_reply_to_message_id_fkey" FOREIGN KEY ("reply_to_message_id") REFERENCES "chat"."message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."message_attachment" ADD CONSTRAINT "message_attachment_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat"."message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."message_delivery" ADD CONSTRAINT "message_delivery_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "chat"."message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat"."message_delivery" ADD CONSTRAINT "message_delivery_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
