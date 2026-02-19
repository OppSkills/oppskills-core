-- CreateTable
CREATE TABLE "oppskills"."admin_log" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_log_admin_id_idx" ON "oppskills"."admin_log"("admin_id");

-- CreateIndex
CREATE INDEX "admin_log_type_idx" ON "oppskills"."admin_log"("type");

-- CreateIndex
CREATE INDEX "admin_log_created_at_idx" ON "oppskills"."admin_log"("created_at");

-- AddForeignKey
ALTER TABLE "oppskills"."admin_log" ADD CONSTRAINT "admin_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "oppskills"."admin_entity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
