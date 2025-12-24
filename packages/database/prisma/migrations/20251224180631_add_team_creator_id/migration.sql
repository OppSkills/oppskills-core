/*
  Warnings:

  - Added the required column `creator_id` to the `team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "oppskills"."team" ADD COLUMN     "creator_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "oppskills"."team" ADD CONSTRAINT "team_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
