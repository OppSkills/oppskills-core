/*
  Warnings:

  - You are about to drop the column `createdAt` on the `AdminEntity` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `AdminEntity` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "oppskills"."AdminEntity" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "is_first_time" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
