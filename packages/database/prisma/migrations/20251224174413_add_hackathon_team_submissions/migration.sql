-- CreateTable
CREATE TABLE "oppskills"."hackathon_team_round_submission" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "submitted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hackathon_team_round_submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hackathon_team_round_submission_team_id_idx" ON "oppskills"."hackathon_team_round_submission"("team_id");

-- CreateIndex
CREATE INDEX "hackathon_team_round_submission_round_id_idx" ON "oppskills"."hackathon_team_round_submission"("round_id");

-- CreateIndex
CREATE UNIQUE INDEX "hackathon_team_round_submission_team_id_round_id_key" ON "oppskills"."hackathon_team_round_submission"("team_id", "round_id");

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_team_round_submission" ADD CONSTRAINT "hackathon_team_round_submission_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "oppskills"."team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oppskills"."hackathon_team_round_submission" ADD CONSTRAINT "hackathon_team_round_submission_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "oppskills"."round"("id") ON DELETE CASCADE ON UPDATE CASCADE;
