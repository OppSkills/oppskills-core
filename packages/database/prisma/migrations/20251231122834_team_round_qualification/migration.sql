-- AlterTable
ALTER TABLE "oppskills"."hackathon" ADD COLUMN     "free_college_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateTable
CREATE TABLE "oppskills"."team_round_qualification" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "qualified_at" TIMESTAMP(3),
    "qualified_by" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_round_qualification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "team_round_qualification_team_id_idx" ON "oppskills"."team_round_qualification"("team_id");

-- CreateIndex
CREATE INDEX "team_round_qualification_round_id_idx" ON "oppskills"."team_round_qualification"("round_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_round_qualification_team_id_round_id_key" ON "oppskills"."team_round_qualification"("team_id", "round_id");

-- AddForeignKey
ALTER TABLE "oppskills"."team_round_qualification" ADD CONSTRAINT "team_round_qualification_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "oppskills"."team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."team_round_qualification" ADD CONSTRAINT "team_round_qualification_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "oppskills"."round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
