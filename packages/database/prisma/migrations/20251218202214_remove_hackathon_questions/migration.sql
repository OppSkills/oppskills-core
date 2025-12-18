-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "oppskills";

-- CreateEnum
CREATE TYPE "oppskills"."HackathonMode" AS ENUM ('ONLINE', 'OFFLINE', 'HYBRID');

-- CreateEnum
CREATE TYPE "oppskills"."AccessLevel" AS ENUM ('ADMIN', 'USER', 'VIEWER');

-- CreateEnum
CREATE TYPE "oppskills"."LifecycleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "oppskills"."Visibility" AS ENUM ('PUBLIC', 'PRIVATE', 'UNIVERSITY_ONLY');

-- CreateEnum
CREATE TYPE "oppskills"."HackathonType" AS ENUM ('CODING_HACKATHON', 'IDEA_HACKATHON', 'CASE_STUDY_COMPETITION', 'DESIGN_HACKATHON', 'OPEN_HACKATHON');

-- CreateEnum
CREATE TYPE "oppskills"."ParticipantType" AS ENUM ('INDIVIDUAL', 'TEAM_OF_2', 'TEAM_OF_3', 'TEAM_OF_4', 'TEAM_OF_5', 'TEAM_OF_6', 'MORE_THAN_6');

-- CreateEnum
CREATE TYPE "oppskills"."LocationType" AS ENUM ('PHYSICAL', 'VIRTUAL');

-- CreateEnum
CREATE TYPE "oppskills"."RoundStatus" AS ENUM ('UPCOMING', 'ONGOING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "oppskills"."RegistrationFieldType" AS ENUM ('TEXT', 'PHONE_NO', 'EMAIL', 'NUMBER', 'ATTACHMENTS', 'OPTIONS');

-- CreateEnum
CREATE TYPE "oppskills"."HackathonAttendeeEligibility" AS ENUM ('EVERYONE_CAN_APPLY', 'SCHOOL_STUDENTS', 'COLLEGE_STUDENTS', 'FRESHERS', 'PROFESSIONALS');

-- CreateEnum
CREATE TYPE "oppskills"."HackathonRoundType" AS ENUM ('ONLINE', 'OFFLINE', 'PRESENTATION');

-- CreateTable
CREATE TABLE "oppskills"."user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "imageUrl" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "access_level" "oppskills"."AccessLevel" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."hackathon" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "mode" "oppskills"."HackathonMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "festival_id" TEXT,
    "bannerImageUrl" TEXT,
    "visibility" "oppskills"."Visibility" NOT NULL DEFAULT 'PUBLIC',
    "hackathonType" "oppskills"."HackathonType" NOT NULL DEFAULT 'CODING_HACKATHON',
    "participantType" "oppskills"."ParticipantType" NOT NULL DEFAULT 'INDIVIDUAL',
    "location_type" "oppskills"."LocationType",
    "location_address" TEXT,
    "location_city" TEXT,
    "location_virtual_link" TEXT,
    "registration_deadline" TIMESTAMP(3),
    "external_registration_link" TEXT,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "entry_fee_amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "prize_total_worth_amount" DECIMAL(12,2),
    "prize_description" JSONB,
    "prize_certificate" BOOLEAN NOT NULL DEFAULT false,
    "organization_name" TEXT,
    "organization_logo_url" TEXT,
    "allowed_universities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "attendee_eligibility" "oppskills"."HackathonAttendeeEligibility"[] DEFAULT ARRAY[]::"oppskills"."HackathonAttendeeEligibility"[],
    "max_teams" INTEGER,
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "registration_count" INTEGER NOT NULL DEFAULT 0,
    "status" "oppskills"."LifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "hackathon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."festival" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "poster_image_url" TEXT,
    "website_url" TEXT,
    "location_type" "oppskills"."LocationType",
    "location_address" TEXT,
    "location_city" TEXT,
    "location_virtual_link" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "organizer_id" TEXT,
    "organization_name" TEXT,
    "organization_logo_url" TEXT,
    "status" "oppskills"."LifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "festival_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."round" (
    "id" TEXT NOT NULL,
    "hackathon_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL,
    "status" "oppskills"."RoundStatus" NOT NULL DEFAULT 'UPCOMING',
    "round_type" "oppskills"."HackathonRoundType" NOT NULL,
    "submission_config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."registration_form" (
    "id" TEXT NOT NULL,
    "external_form_link" TEXT,
    "hackathon_id" TEXT,
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

-- CreateTable
CREATE TABLE "oppskills"."team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "maxSize" INTEGER NOT NULL,
    "hackathonId" TEXT NOT NULL,
    "leaderId" TEXT NOT NULL,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."team_member" (
    "id" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."hackathon_attachment" (
    "id" TEXT NOT NULL,
    "hackathon_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hackathon_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "oppskills"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_slug_key" ON "oppskills"."hackathon"("slug");

-- CreateIndex
CREATE INDEX "hackathon_festival_id_idx" ON "oppskills"."hackathon"("festival_id");

-- CreateIndex
CREATE UNIQUE INDEX "festival_slug_key" ON "oppskills"."festival"("slug");

-- CreateIndex
CREATE INDEX "festival_organizer_id_idx" ON "oppskills"."festival"("organizer_id");

-- CreateIndex
CREATE INDEX "round_hackathon_id_idx" ON "oppskills"."round"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "round_hackathon_id_order_key" ON "oppskills"."round"("hackathon_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "registration_form_hackathon_id_key" ON "oppskills"."registration_form"("hackathon_id");

-- CreateIndex
CREATE INDEX "registration_field_registration_form_id_idx" ON "oppskills"."registration_field"("registration_form_id");

-- CreateIndex
CREATE UNIQUE INDEX "registration_field_registration_form_id_order_key" ON "oppskills"."registration_field"("registration_form_id", "order");

-- CreateIndex
CREATE INDEX "prize_breakdown_hackathon_id_idx" ON "oppskills"."prize_breakdown"("hackathon_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_userId_teamId_key" ON "oppskills"."team_member"("userId", "teamId");

-- CreateIndex
CREATE INDEX "hackathon_attachment_hackathon_id_idx" ON "oppskills"."hackathon_attachment"("hackathon_id");

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon" ADD CONSTRAINT "hackathon_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "oppskills"."festival"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon" ADD CONSTRAINT "hackathon_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."festival" ADD CONSTRAINT "festival_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."round" ADD CONSTRAINT "round_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."registration_form" ADD CONSTRAINT "registration_form_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."registration_field" ADD CONSTRAINT "registration_field_registration_form_id_fkey" FOREIGN KEY ("registration_form_id") REFERENCES "oppskills"."registration_form"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."prize_breakdown" ADD CONSTRAINT "prize_breakdown_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."team" ADD CONSTRAINT "team_hackathonId_fkey" FOREIGN KEY ("hackathonId") REFERENCES "oppskills"."hackathon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."team" ADD CONSTRAINT "team_leaderId_fkey" FOREIGN KEY ("leaderId") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."team_member" ADD CONSTRAINT "team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "oppskills"."team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_attachment" ADD CONSTRAINT "hackathon_attachment_hackathon_id_fkey" FOREIGN KEY ("hackathon_id") REFERENCES "oppskills"."hackathon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
