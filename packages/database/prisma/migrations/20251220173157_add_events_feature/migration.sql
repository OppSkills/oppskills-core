-- CreateEnum
CREATE TYPE "oppskills"."EventUserRole" AS ENUM ('MANAGER', 'EVALUATOR');

-- CreateTable
CREATE TABLE "oppskills"."event" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "banner_image_url" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "festival_id" TEXT,
    "location_type" "oppskills"."LocationType",
    "location_address" TEXT,
    "location_city" TEXT,
    "location_virtual_link" TEXT,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "entry_fee_amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "max_users" INTEGER,
    "registration_count" INTEGER NOT NULL DEFAULT 0,
    "registration_deadline" TIMESTAMP(3),
    "status" "oppskills"."LifecycleStatus" NOT NULL DEFAULT 'DRAFT',
    "owner_id" TEXT NOT NULL,
    "organization_name" TEXT,
    "organization_logo_url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_participant" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oppskills"."event_user_role" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "oppskills"."EventUserRole" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by_id" TEXT,

    CONSTRAINT "event_user_role_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_slug_key" ON "oppskills"."event"("slug");

-- CreateIndex
CREATE INDEX "event_festival_id_idx" ON "oppskills"."event"("festival_id");

-- CreateIndex
CREATE INDEX "event_owner_id_idx" ON "oppskills"."event"("owner_id");

-- CreateIndex
CREATE INDEX "event_participant_event_id_idx" ON "oppskills"."event_participant"("event_id");

-- CreateIndex
CREATE INDEX "event_participant_user_id_idx" ON "oppskills"."event_participant"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_participant_event_id_user_id_key" ON "oppskills"."event_participant"("event_id", "user_id");

-- CreateIndex
CREATE INDEX "event_user_role_event_id_idx" ON "oppskills"."event_user_role"("event_id");

-- CreateIndex
CREATE INDEX "event_user_role_user_id_idx" ON "oppskills"."event_user_role"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_user_role_event_id_user_id_role_key" ON "oppskills"."event_user_role"("event_id", "user_id", "role");

-- AddForeignKey
ALTER TABLE "oppskills"."event" ADD CONSTRAINT "event_festival_id_fkey" FOREIGN KEY ("festival_id") REFERENCES "oppskills"."festival"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event" ADD CONSTRAINT "event_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "oppskills"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_participant" ADD CONSTRAINT "event_participant_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_participant" ADD CONSTRAINT "event_participant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_user_role" ADD CONSTRAINT "event_user_role_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "oppskills"."event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_user_role" ADD CONSTRAINT "event_user_role_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."event_user_role" ADD CONSTRAINT "event_user_role_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "oppskills"."user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
