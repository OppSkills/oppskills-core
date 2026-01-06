-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "oppskills"."ParticipantType" ADD VALUE 'TEAM_OF_2_3';
ALTER TYPE "oppskills"."ParticipantType" ADD VALUE 'TEAM_OF_2_4';
ALTER TYPE "oppskills"."ParticipantType" ADD VALUE 'TEAM_OF_3_4';
ALTER TYPE "oppskills"."ParticipantType" ADD VALUE 'TEAM_OF_3_5';
ALTER TYPE "oppskills"."ParticipantType" ADD VALUE 'TEAM_OF_4_5';
ALTER TYPE "oppskills"."ParticipantType" ADD VALUE 'TEAM_OF_4_6';
ALTER TYPE "oppskills"."ParticipantType" ADD VALUE 'TEAM_OF_5_6';
