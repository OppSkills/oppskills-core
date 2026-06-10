-- CreateTable
CREATE TABLE "common"."skill_category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "common"."skill_category_skill" (
    "skill_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_category_skill_pkey" PRIMARY KEY ("skill_id","category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_slug_key" ON "common"."skill"("slug");

-- AddForeignKey
ALTER TABLE "common"."skill_category_skill" ADD CONSTRAINT "skill_category_skill_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "common"."skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "common"."skill_category_skill" ADD CONSTRAINT "skill_category_skill_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "common"."skill_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
