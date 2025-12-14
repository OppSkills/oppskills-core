-- CreateEnum
CREATE TYPE "oppskills"."PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "oppskills"."Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNIVERSITY_ONLY');

-- CreateEnum
CREATE TYPE "oppskills"."HackathonType" AS ENUM ('CODING_HACKATHON', 'IDEA_HACKATHON', 'CASE_STUDY_COMPETITION', 'DESIGN_HACKATHON', 'OPEN_HACKATHON');

-- CreateEnum
CREATE TYPE "oppskills"."ParticipantType" AS ENUM ('INDIVIDUAL', 'TEAM_OF_2', 'TEAM_OF_3', 'TEAM_OF_4', 'TEAM_OF_5', 'TEAM_OF_6', 'MORE_THAN_6');

-- CreateEnum
CREATE TYPE "oppskills"."LocationType" AS ENUM ('PHYSICAL', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "oppskills"."HackathonStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "oppskills"."RoundStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "oppskills"."RegistrationFieldType" AS ENUM ('TEXT', 'PHONE_NO', 'EMAIL', 'NUMBER', 'ATTACHMENTS', 'OPTIONS');

-- AlterTable
ALTER TABLE "oppskills"."hackathon" ADD COLUMN     "allowed_universities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "bannerImageUrl" TEXT,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'INR',
ADD COLUMN     "entry_fee_amount" DECIMAL(12,2),
ADD COLUMN     "external_registration_link" TEXT,
ADD COLUMN     "hackathonType" "oppskills"."HackathonType" NOT NULL DEFAULT 'CODING_HACKATHON',
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_free" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location_address" TEXT,
ADD COLUMN     "location_city" TEXT,
ADD COLUMN     "location_type" "oppskills"."LocationType",
ADD COLUMN     "location_virtual_link" TEXT,
ADD COLUMN     "organization_logo_url" TEXT,
ADD COLUMN     "organization_name" TEXT,
ADD COLUMN     "participantType" "oppskills"."ParticipantType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "prize_total_worth_amount" DECIMAL(12,2),
ADD COLUMN     "published_at" TIMESTAMP(3),
ADD COLUMN     "registration_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "registration_deadline" TIMESTAMP(3),
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_id" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "oppskills"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "visibility" "oppskills"."Visibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "oppskills"."event" (
    "id" TEXT NOT NULL,
    "slug" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "poster_image_url" TEXT,
    "website_url" TEXT,
    "hackathon_id" TEXT,
    "location_type" "oppskills"."LocationType",
    "location_address" TEXT,
    "location_city" TEXT,
    "location_virtual_link" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "event_time" TEXT,
    "visibility" "oppskills"."Visibility",
    "mode" "oppskills"."HackathonMode",
    "external_registration_link" TEXT,
    "is_free" BOOLEAN,
    "entry_fee_amount" DECIMAL(12,2),
    "currency" TEXT,
    "organizer_user_id" TEXT,
    "organization_name" TEXT,
    "organization_logo_url" TEXT,
    "status" "oppskills"."PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "published_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" TEXT,
    "rejection_reason" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "registration_count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."round" (
    "id" TEXT NOT NULL,
    "hackathon_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "oppskills"."RoundStatus" NOT NULL DEFAULT 'UPCOMING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."registration_form" (
    "id" TEXT NOT NULL,
    "external_form_link" TEXT,
    "hackathon_id" TEXT,
    "event_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."registration_field" (
    "id" TEXT NOT NULL,
    "registration_form_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" "oppskills"."RegistrationFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "placeholder" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registration_field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."prize_breakdown" (
    "id" TEXT NOT NULL,
    "hackathon_id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prize_breakdown_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_slug_key" ON "oppskills"."event"("slug");

-- CreateIndex
CREATE INDEX "event_hackathon_id_idx" ON "oppskills"."event"("hackathon_id");

-- CreateIndex
CREATE INDEX "round_hackathon_id_idx" ON "oppskills"."round"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "round_hackathon_id_order_key" ON "oppskills"."round"("hackathon_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "registration_form_hackathon_id_key" ON "oppskills"."registration_form"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_form_event_id_key" ON "oppskills"."registration_form"("event_id");

-- CreateIndex
CREATE INDEX "registration_field_registration_form_id_idx" ON "oppskills"."registration_field"("registration_form_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_field_registration_form_id_order_key" ON "oppskills"."registration_field"("registration_form_id", "order");

-- CreateIndex
CREATE INDEX "prize_breakdown_hackathon_id_idx" ON "oppskills"."prize_breakdown"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_slug_key" ON "oppskills"."hackathon"("slug");

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon" ADD CONSTRAINT "hackathon_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event" ADD CONSTRAINT "event_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event" ADD CONSTRAINT "event_organizer_user_id_fkey" FOREIGN KEY ("organizer_user_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event" ADD CONSTRAINT "event_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."round" ADD CONSTRAINT "round_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."registration_form" ADD CONSTRAINT "registration_form_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."registration_form" ADD CONSTRAINT "registration_form_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."registration_field" ADD CONSTRAINT "registration_field_registration_form_id_fkey" FOREIGN KEY ("registration_form_id") REFERENCES "oppskills"."registration_form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."prize_breakdown" ADD CONSTRAINT "prize_breakdown_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
