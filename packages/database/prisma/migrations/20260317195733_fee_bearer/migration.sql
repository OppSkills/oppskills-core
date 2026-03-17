-- CreateEnum
CREATE TYPE "oppskills"."FeeBearer" AS ENUM ('ORGANISER', 'PARTICIPANT');

-- AlterTable
ALTER TABLE "oppskills"."event" ADD COLUMN     "fee_bearer" "oppskills"."FeeBearer" NOT NULL DEFAULT 'ORGANISER';

-- AlterTable
ALTER TABLE "oppskills"."hackathon" ADD COLUMN     "fee_bearer" "oppskills"."FeeBearer" NOT NULL DEFAULT 'ORGANISER';
