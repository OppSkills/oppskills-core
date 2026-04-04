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
import { Button } from "@/components/ui/button";
import { SubmissionModal } from "./SubmissionModal";
import type { RoundSubmissionInfo } from "@/lib/api/hackathonApi";
import { formatDate } from "date-fns";

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
    <div className="space-y-6 md:space-y-8">
      <h2 className="text-3xl font-semibold text-neutral-800 mb-6">
        Rounds Timeline
      </h2>

      <div className="space-y-4 md:space-y-6">
        {rounds.map((round, index) => {
          const roundNumber = index + 1;
          const status = round.status;
          const submission = submissionsByRoundId[round.id];
          const hasSubmitted = !!submission?.submittedAt;

          return (
            <div key={round.id} className="flex gap-4 md:gap-6 relative">
              {index !== rounds.length - 1 && (
                <div className="absolute left-[24px] top-[48px] bottom-[-16px] md:bottom-[-24px] w-[2px] bg-primary-200" />
              )}

              <div className="flex-shrink-0 flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center z-10 bg-primary-200"
                  )}
                >
                  <span
                    className="text-primary-900"
                  >
                    R{roundNumber}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-background rounded-2xl border border-neutral-200 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
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
                      <span
                        className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full border",
                          round.roundType === "ONLINE"
                            ? "bg-blue-50 text-blue-700 border-blue-100"
                            : round.roundType === "OFFLINE"
                              ? "bg-orange-50 text-orange-700 border-orange-100"
                              : "bg-purple-50 text-purple-700 border-purple-100",
                        )}
                      >
                        {round.roundType}
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
                          Start: {formatDate(round.startDate, "dd MMM yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-neutral-600">
                        <Calendar className="w-4 h-4 text-neutral-500 stroke-[2] opacity-80" />
                        <span className="text-sm">End: {formatDate(round.endDate, "dd MMM yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  {myTeam && status === "completed" && (
                    <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-neutral-100 mt-2 md:mt-0">
                      {index < rounds.length - 1 ? (
                        <>
                          {qualificationsByRoundId?.[rounds[index + 1].id]
                            ?.qualified ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                Qualified for {rounds[index + 1].name}
                              </span>
                            </div>
                          ) : qualificationsByRoundId?.[rounds[index + 1].id]
                            ?.qualified === false ? (
                            <div className="flex items-center gap-2 text-red-600">
                              <XCircle className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                Not qualified for {rounds[index + 1].name}
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
                        </>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="text-sm font-medium">
                            Participation Completed
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {myTeam &&
                    status === "live" &&
                    round.submissionConfig?.enabled && (
                      <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-neutral-100 mt-2 md:mt-0">
                        {index > 0 &&
                          qualificationsByRoundId?.[round.id]?.qualified ===
                          false ? (
                          <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                            <XCircle className="w-5 h-5" />
                            <span className="text-sm font-semibold">
                              Disqualified - Cannot submit
                            </span>
                          </div>
                        ) : index > 0 &&
                          !qualificationsByRoundId?.[round.id]?.qualified ? (
                          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm font-semibold">
                              Awaiting qualification to submit
                            </span>
                          </div>
                        ) : (
                          <>
                            {hasSubmitted ? (
                              <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                  Submitted (
                                  {submission.payload.files?.length ?? 0} file
                                  {(submission.payload.files?.length ?? 0) !== 1
                                    ? "s"
                                    : ""}
                                  )
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
                                className="w-full md:w-auto"
                              >
                                <Upload className="w-4 h-4 mr-1" />
                                {hasSubmitted ? "Edit Submission" : "Submit"}
                              </Button>
                            ) : (
                              <p className="text-xs text-neutral-500">
                                Only team leader can submit
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    )}

                  {myTeam && status === "completed" && hasSubmitted && (
                    <div className="flex items-center gap-2 text-green-600 md:ml-auto">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        Submitted ({submission.payload.files?.length ?? 0} file
                        {(submission.payload.files?.length ?? 0) !== 1
                          ? "s"
                          : ""}
                        )
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
