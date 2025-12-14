-- CreateEnum
CREATE TYPE "oppskills"."AccessLevel" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- AlterTable
ALTER TABLE "oppskills"."user" ADD COLUMN     "access_level" "oppskills"."AccessLevel" NOT NULL DEFAULT 'USER';
