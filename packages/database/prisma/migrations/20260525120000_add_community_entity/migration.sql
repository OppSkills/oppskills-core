-- CreateEnum
CREATE TYPE "user"."Industry" AS ENUM (
  'TECHNOLOGY',
  'EDUCATION',
  'HEALTHCARE',
  'FINANCE',
  'ARTS_CULTURE',
  'SPORTS_FITNESS',
  'FOOD_BEVERAGE',
  'TRAVEL',
  'NONPROFIT',
  'GOVERNMENT',
  'RETAIL',
  'MEDIA_ENTERTAINMENT',
  'REAL_ESTATE',
  'OTHER'
);

-- CreateTable
CREATE TABLE "user"."community" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "handle" TEXT NOT NULL,
  "description" TEXT,
  "website" TEXT,
  "industry" "user"."Industry" NOT NULL,
  "cover_image" TEXT,
  "avatar_image" TEXT,
  "owner_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "community_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_handle_key" ON "user"."community"("handle");

-- CreateIndex
CREATE INDEX "community_owner_id_idx" ON "user"."community"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_name_owner_id_key" ON "user"."community"("name", "owner_id");

-- AddForeignKey
ALTER TABLE "user"."community"
  ADD CONSTRAINT "community_owner_id_fkey"
  FOREIGN KEY ("owner_id") REFERENCES "user"."user"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
