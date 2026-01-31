-- CreateTable
CREATE TABLE "oppskills"."feature_waitlist" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "feature" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "feature_waitlist_user_id_idx" ON "oppskills"."feature_waitlist"("user_id");

-- CreateIndex
CREATE INDEX "feature_waitlist_feature_idx" ON "oppskills"."feature_waitlist"("feature");

-- CreateIndex
CREATE UNIQUE INDEX "feature_waitlist_user_id_feature_key" ON "oppskills"."feature_waitlist"("user_id", "feature");

-- AddForeignKey
ALTER TABLE "oppskills"."feature_waitlist" ADD CONSTRAINT "feature_waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "oppskills"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
