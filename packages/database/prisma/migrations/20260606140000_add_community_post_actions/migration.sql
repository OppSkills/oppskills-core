-- CreateEnum
CREATE TYPE "community"."CommunityPostKind" AS ENUM ('ORIGINAL', 'REPOST', 'QUOTE_REPOST');

-- CreateEnum
CREATE TYPE "community"."CommunityPostCommentStatus" AS ENUM ('PUBLISHED', 'DELETED');

-- AlterTable
ALTER TABLE "community"."community_post" ADD COLUMN "comment_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "community"."community_post" ADD COLUMN "repost_count" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "community"."community_post" ADD COLUMN "post_kind" "community"."CommunityPostKind" NOT NULL DEFAULT 'ORIGINAL';
ALTER TABLE "community"."community_post" ADD COLUMN "reposted_from_post_id" TEXT;

-- DropIndex
DROP INDEX "community"."community_post_community_id_status_created_at_id_idx";

-- CreateIndex
CREATE INDEX "community_post_community_id_status_post_kind_created_at_id_idx" ON "community"."community_post"("community_id", "status", "post_kind", "created_at" DESC, "id" DESC);
CREATE INDEX "community_post_author_id_status_created_at_id_idx" ON "community"."community_post"("author_id", "status", "created_at" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "community"."community_post" ADD CONSTRAINT "community_post_reposted_from_post_id_fkey" FOREIGN KEY ("reposted_from_post_id") REFERENCES "community"."community_post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "community"."community_post_comment" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "reply_count" INTEGER NOT NULL DEFAULT 0,
    "status" "community"."CommunityPostCommentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_post_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_post_comment_like" (
    "id" TEXT NOT NULL,
    "comment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_comment_like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community"."community_post_repost" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "original_post_id" TEXT NOT NULL,
    "repost_post_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_post_repost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_post_comment_post_id_parent_id_status_created_at_id_idx" ON "community"."community_post_comment"("post_id", "parent_id", "status", "created_at" DESC, "id" DESC);
CREATE INDEX "community_post_comment_parent_id_status_created_at_id_idx" ON "community"."community_post_comment"("parent_id", "status", "created_at" ASC, "id" ASC);
CREATE INDEX "community_post_comment_author_id_idx" ON "community"."community_post_comment"("author_id");
CREATE UNIQUE INDEX "community_post_comment_like_comment_id_user_id_key" ON "community"."community_post_comment_like"("comment_id", "user_id");
CREATE INDEX "community_post_comment_like_user_id_idx" ON "community"."community_post_comment_like"("user_id");
CREATE UNIQUE INDEX "community_post_repost_repost_post_id_key" ON "community"."community_post_repost"("repost_post_id");
CREATE UNIQUE INDEX "community_post_repost_user_id_original_post_id_key" ON "community"."community_post_repost"("user_id", "original_post_id");
CREATE INDEX "community_post_repost_original_post_id_idx" ON "community"."community_post_repost"("original_post_id");

-- AddForeignKey
ALTER TABLE "community"."community_post_comment" ADD CONSTRAINT "community_post_comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community"."community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community"."community_post_comment" ADD CONSTRAINT "community_post_comment_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"."user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "community"."community_post_comment" ADD CONSTRAINT "community_post_comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "community"."community_post_comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community"."community_post_comment_like" ADD CONSTRAINT "community_post_comment_like_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "community"."community_post_comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community"."community_post_comment_like" ADD CONSTRAINT "community_post_comment_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community"."community_post_repost" ADD CONSTRAINT "community_post_repost_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community"."community_post_repost" ADD CONSTRAINT "community_post_repost_original_post_id_fkey" FOREIGN KEY ("original_post_id") REFERENCES "community"."community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "community"."community_post_repost" ADD CONSTRAINT "community_post_repost_repost_post_id_fkey" FOREIGN KEY ("repost_post_id") REFERENCES "community"."community_post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
