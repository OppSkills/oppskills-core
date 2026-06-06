-- CreateEnum
CREATE TYPE "community"."CommunityPostStatus" AS ENUM ('PUBLISHED', 'DELETED');

-- CreateTable
CREATE TABLE "community"."community_post" (
    "id" TEXT NOT NULL,
    "community_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "status" "community"."CommunityPostStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_post_image" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "community_post_image_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_post_like" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_like_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_post_community_id_status_created_at_id_idx" ON "community"."community_post"("community_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "community_post_image_post_id_idx" ON "community"."community_post_image"("post_id");

-- CreateIndex
CREATE INDEX "community_post_like_user_id_idx" ON "community"."community_post_like"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "community_post_like_post_id_user_id_key" ON "community"."community_post_like"("post_id", "user_id");

-- AddForeignKey
ALTER TABLE "community"."community_post" ADD CONSTRAINT "community_post_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "community"."community"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_post" ADD CONSTRAINT "community_post_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_post_image" ADD CONSTRAINT "community_post_image_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community"."community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_post_like" ADD CONSTRAINT "community_post_like_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community"."community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community"."community_post_like" ADD CONSTRAINT "community_post_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
