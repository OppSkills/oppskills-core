"use client";

import React, { useState } from "react";
import { Round } from "./types";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Upload,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmissionModal } from "./SubmissionModal";
import type { RoundSubmissionInfo } from "@/lib/api/hackathonApi";

export type { RoundSubmissionInfo };

interface RoundsTimelineProps {
  rounds: Round[];
  myTeam?: {
    id: string;
    name: string;
    leaderId: string;
  } | null;
  submissionsByRoundId?: Record<string, RoundSubmissionInfo>;
  qualificationsByRoundId?: Record<
    string,
    { qualified: boolean; qualifiedAt?: string }
  >;
  competitionSlug?: string;
  currentUserId?: string;
}

export function RoundsTimeline({
  rounds,
  myTeam,
  submissionsByRoundId = {},
  qualificationsByRoundId = {},
  competitionSlug,
  currentUserId,
}: RoundsTimelineProps) {
  const [submissionModalRound, setSubmissionModalRound] =
    useState<Round | null>(null);
  const isTeamLeader =
    myTeam && currentUserId && myTeam.leaderId === currentUserId;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">
        Rounds Timeline
      </h2>

      <div className="space-y-6">
        {rounds.map((round, index) => {
          const roundNumber = index + 1;
          const status = round.status;
          const submission = submissionsByRoundId[round.id];
          const hasSubmitted = !!submission?.submittedAt;

          return (
            <div key={round.id} className="flex gap-6 relative">
              {index !== rounds.length - 1 && (
                <div className="absolute left-[24px] top-[48px] bottom-[-24px] w-[2px] bg-[#eaccf7]" />
              )}

              <div className="flex-shrink-0 flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center z-10",
                    status === "completed"
                      ? "bg-green-100"
                      : status === "live"
                        ? "bg-purple-200"
                        : "bg-[#eaccf7]",
                  )}
                >
                  <span
                    className={cn(
                      "text-lg font-bold",
                      status === "completed"
                        ? "text-green-700"
                        : status === "live"
                          ? "text-purple-700"
                          : "text-[#3c0055]",
                    )}
                  >
                    R{roundNumber}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-background rounded-2xl border border-neutral-200 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-neutral-900">
                        {round.name}
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full",
                          status === "completed"
                            ? "bg-green-100 text-green-700"
                            : status === "live"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-neutral-100 text-neutral-600",
                        )}
                      >
                        {status === "completed"
                          ? "Completed"
                          : status === "live"
                            ? "Live"
                            : "Upcoming"}
                      </span>
                    </div>

                    {round.description && (
                      <div
                        className="prose prose-sm max-w-none text-neutral-500 mb-4"
                        dangerouslySetInnerHTML={{ __html: round.description }}
                      />
                    )}

                    <div className="space-y-2 mt-4">
                      <div className="flex items-center gap-3 text-neutral-600">
                        <Calendar className="w-4 h-4 text-neutral-500 stroke-[2] opacity-80" />
                        <span className="text-sm">
                          Start: {round.startDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-600">
                        <Calendar className="w-4 h-4 text-neutral-500 stroke-[2] opacity-80" />
                        <span className="text-sm">End: {round.endDate}</span>
                      </div>
                    </div>
                  </div>

                  {myTeam && status === "completed" && (
                    <div className="flex flex-col items-end gap-2">
                      {qualificationsByRoundId?.[round.id]?.qualified ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            Qualified for next round
                          </span>
                        </div>
                      ) : qualificationsByRoundId?.[round.id]?.qualified ===
                        false ? (
                        <div className="flex items-center gap-2 text-red-600">
                          <XCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            Not qualified
                          </span>
                        </div>
                      ) : hasSubmitted ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <Clock className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            Awaiting results
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <span className="text-sm">
                            Round ended - no submission
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {myTeam &&
                    status === "live" &&
                    round.submissionConfig?.enabled && (
                      <div className="flex flex-col items-end gap-2">
                        {hasSubmitted ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-sm font-medium">
                              Submitted
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-medium">
                              Not submitted
                            </span>
                          </div>
                        )}

                        {isTeamLeader ? (
                          <Button
                            size="sm"
                            variant={hasSubmitted ? "outline" : "default"}
                            onClick={() => setSubmissionModalRound(round)}
                          >
                            <Upload className="w-4 h-4 mr-1" />
                            {hasSubmitted ? "Edit Submission" : "Submit"}
                          </Button>
                        ) : (
                          <p className="text-xs text-neutral-500">
                            Only team leader can submit
                          </p>
                        )}
                      </div>
                    )}

                  {myTeam && status === "completed" && hasSubmitted && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Submitted ({submission.files?.length ?? 0} file
                        {(submission.files?.length ?? 0) !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {submissionModalRound && competitionSlug && (
        <SubmissionModal
          round={submissionModalRound}
          competitionSlug={competitionSlug}
          existingSubmission={submissionsByRoundId[submissionModalRound.id]}
          onClose={() => setSubmissionModalRound(null)}
        />
      )}
    </div>
  );
}
