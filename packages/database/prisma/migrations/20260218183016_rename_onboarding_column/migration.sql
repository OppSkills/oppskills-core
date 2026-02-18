/*
  Warnings:

  - You are about to drop the `AdminEntity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "oppskills"."AdminEntity";

-- CreateTable
CREATE TABLE "oppskills"."admin_entity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "immutable" BOOLEAN NOT NULL DEFAULT false,
    "is_first_login" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_entity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_entity_email_key" ON "oppskills"."admin_entity"("email");

-- CreateIndex
CREATE INDEX "admin_entity_id_idx" ON "oppskills"."admin_entity"("id");

-- CreateIndex
CREATE INDEX "admin_entity_email_idx" ON "oppskills"."admin_entity"("email");
