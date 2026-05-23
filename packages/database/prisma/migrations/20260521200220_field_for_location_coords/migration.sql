/*
  Warnings:

  - You are about to drop the column `location_city` on the `event` table. All the data in the column will be lost.
  - You are about to drop the column `location_city` on the `hackathon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "events"."event" DROP COLUMN "location_city",
ADD COLUMN     "location_coords" TEXT;

-- AlterTable
ALTER TABLE "hackathon"."hackathon" DROP COLUMN "location_city",
ADD COLUMN     "location_coords" TEXT;
