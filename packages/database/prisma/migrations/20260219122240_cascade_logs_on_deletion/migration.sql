-- DropForeignKey
ALTER TABLE "oppskills"."admin_log" DROP CONSTRAINT "admin_log_admin_id_fkey";

-- AddForeignKey
ALTER TABLE "oppskills"."admin_log" ADD CONSTRAINT "admin_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "oppskills"."admin_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
