/*
  Warnings:

  - You are about to drop the column `location_city` on the `festival` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "common"."festival" DROP COLUMN "location_city",
ADD COLUMN     "location_coords" TEXT;
