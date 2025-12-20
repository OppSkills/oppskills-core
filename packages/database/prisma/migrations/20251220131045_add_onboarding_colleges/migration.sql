-- CreateEnum
CREATE TYPE "oppskills"."Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "oppskills"."UserCategory" AS ENUM ('SCHOOL_STUDENT', 'COLLEGE_STUDENT', 'WORKING_PROFESSIONAL', 'FRESHER', 'PROFESSIONAL_SCHOOL_STUDENT');

-- CreateEnum
CREATE TYPE "oppskills"."ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "oppskills"."TeamPreference" AS ENUM ('LOOKING_FOR_TEAM', 'HAVE_TEAM', 'OPEN_TO_EITHER', 'PREFER_SOLO');

-- AlterTable
ALTER TABLE "oppskills"."user" ADD COLUMN     "onboarded" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "oppskills"."college" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "website" TEXT,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "college_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."user_onboarding_profile" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "gender" "oppskills"."Gender" NOT NULL,
    "user_category" "oppskills"."UserCategory" NOT NULL,
    "school_name" TEXT,
    "school_class" TEXT,
    "school_address" TEXT,
    "college_id" TEXT,
    "college_current_year" TEXT,
    "college_passout_year" INTEGER,
    "college_skipped" BOOLEAN NOT NULL DEFAULT false,
    "company_name" TEXT,
    "job_title" TEXT,
    "location_city" TEXT NOT NULL,
    "location_state" TEXT NOT NULL,
    "location_country" TEXT NOT NULL,
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience_level" "oppskills"."ExperienceLevel",
    "team_preference" "oppskills"."TeamPreference",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_onboarding_profile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "college_name_idx" ON "oppskills"."college"("name");

-- CreateIndex
CREATE INDEX "college_city_idx" ON "oppskills"."college"("city");

-- CreateIndex
CREATE INDEX "college_state_idx" ON "oppskills"."college"("state");

-- CreateIndex
CREATE UNIQUE INDEX "user_onboarding_profile_user_id_key" ON "oppskills"."user_onboarding_profile"("user_id");

-- AddForeignKey
ALTER TABLE "oppskills"."user_onboarding_profile" ADD CONSTRAINT "user_onboarding_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."user_onboarding_profile" ADD CONSTRAINT "user_onboarding_profile_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "oppskills"."college"("id") ON DELETE SET NULL ON UPDATE CASCADE;
