-- CreateEnum
CREATE TYPE "oppskills"."HackathonUserRole" AS ENUM ('MANAGER', 'EVALUATOR');

-- CreateTable
CREATE TABLE "oppskills"."hackathon_user_role" (
    "id" TEXT NOT NULL,
    "hackathon_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "oppskills"."HackathonUserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT NOT NULL,

    CONSTRAINT "hackathon_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hackathon_user_role_hackathon_id_idx" ON "oppskills"."hackathon_user_role"("hackathon_id");

-- CreateIndex
CREATE INDEX "hackathon_user_role_user_id_idx" ON "oppskills"."hackathon_user_role"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_user_role_hackathon_id_user_id_role_key" ON "oppskills"."hackathon_user_role"("hackathon_id", "user_id", "role");

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_user_role" ADD CONSTRAINT "hackathon_user_role_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_user_role" ADD CONSTRAINT "hackathon_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_user_role" ADD CONSTRAINT "hackathon_user_role_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
