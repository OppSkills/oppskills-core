-- CreateEnum
CREATE TYPE "community"."MeetKind" AS ENUM ('INSTANT', 'OPEN_LINK', 'SCHEDULED');

-- CreateEnum
CREATE TYPE "community"."MeetAudienceScope" AS ENUM ('ALL', 'MEMBER_TYPES');

-- CreateEnum
CREATE TYPE "community"."MeetStatus" AS ENUM ('ACTIVE', 'SCHEDULED', 'ENDED');

-- CreateTable
CREATE TABLE "community"."community_meet" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "kind" "community"."MeetKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_start_at" TIMESTAMP(3),
    "audience_scope" "community"."MeetAudienceScope" NOT NULL DEFAULT 'ALL',
    "host_user_id" TEXT NOT NULL,
    "livekit_room_name" TEXT NOT NULL,
    "status" "community"."MeetStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_meet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_meet_invite_code_key" ON "community"."community_meet"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "community_meet_livekit_room_name_key" ON "community"."community_meet"("livekit_room_name");

-- CreateIndex
CREATE INDEX "community_meet_community_id_idx" ON "community"."community_meet"("community_id");

-- CreateIndex
CREATE INDEX "community_meet_host_user_id_idx" ON "community"."community_meet"("host_user_id");

-- AddForeignKey
ALTER TABLE "community"."community_meet" ADD CONSTRAINT "community_meet_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_meet" ADD CONSTRAINT "community_meet_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "user"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
