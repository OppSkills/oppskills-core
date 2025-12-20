-- DropForeignKey
ALTER TABLE "oppskills"."hackathon_user_role" DROP CONSTRAINT "hackathon_user_role_created_by_id_fkey";

-- AlterTable
ALTER TABLE "oppskills"."hackathon_user_role" ALTER COLUMN "created_by_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_user_role" ADD CONSTRAINT "hackathon_user_role_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
