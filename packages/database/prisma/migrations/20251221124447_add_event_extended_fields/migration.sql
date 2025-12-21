-- CreateEnum
CREATE TYPE "oppskills"."EventType" AS ENUM ('WORKSHOP', 'CONFERENCE', 'MEETUP', 'NETWORKING', 'SEMINAR', 'WEBINAR', 'OTHER');

-- CreateEnum
CREATE TYPE "oppskills"."EventAttendeeEligibility" AS ENUM ('EVERYONE_CAN_APPLY', 'SCHOOL_STUDENTS', 'COLLEGE_STUDENTS', 'FRESHERS', 'PROFESSIONALS');

-- AlterTable
ALTER TABLE "oppskills"."event" ADD COLUMN     "attendee_eligibility" "oppskills"."EventAttendeeEligibility"[] DEFAULT ARRAY[]::"oppskills"."EventAttendeeEligibility"[],
ADD COLUMN     "contact_email" TEXT,
ADD COLUMN     "contact_name" TEXT,
ADD COLUMN     "contact_phone" TEXT,
ADD COLUMN     "event_type" "oppskills"."EventType" NOT NULL DEFAULT 'CONFERENCE',
ADD COLUMN     "external_registration_link" TEXT,
ADD COLUMN     "impressions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prize_certificate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prize_description" JSONB,
ADD COLUMN     "prize_total_worth_amount" DECIMAL(12,2),
ADD COLUMN     "visibility" "oppskills"."Visibility" NOT NULL DEFAULT 'PUBLIC';

-- CreateTable
CREATE TABLE "oppskills"."event_registration_form" (
    "id" TEXT NOT NULL,
    "external_form_link" TEXT,
    "event_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_registration_form_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_registration_field" (
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

    CONSTRAINT "event_registration_field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_prize_breakdown" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_prize_breakdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_attachment" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "public_url" TEXT,
    "file_name" TEXT,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_form_event_id_key" ON "oppskills"."event_registration_form"("event_id");

-- CreateIndex
CREATE INDEX "event_registration_field_registration_form_id_idx" ON "oppskills"."event_registration_field"("registration_form_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_registration_field_registration_form_id_order_key" ON "oppskills"."event_registration_field"("registration_form_id", "order");

-- CreateIndex
CREATE INDEX "event_prize_breakdown_event_id_idx" ON "oppskills"."event_prize_breakdown"("event_id");

-- CreateIndex
CREATE INDEX "event_attachment_event_id_idx" ON "oppskills"."event_attachment"("event_id");

-- AddForeignKey
ALTER TABLE "oppskills"."event_registration_form" ADD CONSTRAINT "event_registration_form_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_registration_field" ADD CONSTRAINT "event_registration_field_registration_form_id_fkey" FOREIGN KEY ("registration_form_id") REFERENCES "oppskills"."event_registration_form"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_prize_breakdown" ADD CONSTRAINT "event_prize_breakdown_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_attachment" ADD CONSTRAINT "event_attachment_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
