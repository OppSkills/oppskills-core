"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FileText, ExternalLink, X } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

import { BoneyardSkeleton } from "@/components/boneyard/boneyard-skeleton";
import { StackedFieldsFallback } from "@/components/boneyard/loading-fallbacks";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn, ensureAbsoluteUrl } from "@/lib/utils";

export interface RegistrationField {
  id: string;
  label: string;
  type: string;
}

export interface RegistrationAnswer {
  fieldId: string;
  value: string | string[] | number | null | undefined;
}

export interface Respondent {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string;
  isLeader?: boolean;
  answers: RegistrationAnswer[];
}

interface RegistrationAnswersViewProps {
  fields: RegistrationField[];
  respondents: Respondent[];
  isLoading?: boolean;
}

const isImageFile = (url: string): boolean => {
  if (!url) return false;
  const lowerCaseUrl = url.toLowerCase();
  return (
    lowerCaseUrl.endsWith(".jpg") ||
    lowerCaseUrl.endsWith(".jpeg") ||
    lowerCaseUrl.endsWith(".png") ||
    lowerCaseUrl.endsWith(".gif") ||
    lowerCaseUrl.endsWith(".webp") ||
    lowerCaseUrl.endsWith(".svg") ||
    lowerCaseUrl.includes("cloudfront.net/public/opportunity-attachments") ||
    lowerCaseUrl.includes(".png") ||
    lowerCaseUrl.includes(".jpg") ||
    lowerCaseUrl.includes(".jpeg")
  );
};

const getFileName = (url: string): string => {
  if (!url) return "File";
  try {
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split("/");
    const lastPart = parts[parts.length - 1];
    return lastPart.split("?")[0] || "File";
  } catch (e) {
    return "File";
  }
};

const formatAnswerValue = (
  value: string | string[] | number | null | undefined,
): string => {
  if (value === null || value === undefined) return "—";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
};

export function RegistrationAnswersView({
  fields,
  respondents,
  isLoading = false,
}: RegistrationAnswersViewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <BoneyardSkeleton
      loading={isLoading}
      name="dashboard-registration-answers"
      className="w-full"
      fallback={<StackedFieldsFallback />}
    >
      {!fields.length ? (
        <EmptyState
          title="No registration form"
          description="No registration form or answers found for this opportunity."
          className="py-16"
        />
      ) : (
        <div className="space-y-8">
          {fields.map((field) => (
            <div key={field.id} className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 poppins">
                {field.label}
              </h3>
              <div className="grid gap-3">
                {respondents.map((respondent) => {
                  const answer = respondent.answers.find(
                    (a) => a.fieldId === field.id,
                  );
                  return (
                    <div
                      key={respondent.userId}
                      className="flex items-start gap-4 p-4 bg-muted/20 rounded-xl border border-border/30"
                    >
                      {respondents.length > 1 && (
                        <Avatar className="h-10 w-10 border border-background shadow-sm shrink-0">
                          <AvatarImage src={respondent.avatarUrl} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {respondent.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0">
                        {respondents.length > 1 && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-foreground">
                              {respondent.name}
                            </span>
                            {respondent.isLeader && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] uppercase font-bold tracking-wider py-0 px-2 h-5"
                              >
                                Leader
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="text-sm text-foreground inter leading-relaxed">
                          {field.type === "ATTACHMENTS" &&
                          answer?.value &&
                          typeof answer.value === "string" ? (
                            isImageFile(answer.value) ? (
                              <div
                                className="relative group cursor-pointer w-fit"
                                onClick={() =>
                                  setSelectedImage(
                                    ensureAbsoluteUrl(answer.value as string),
                                  )
                                }
                              >
                                <div className="h-32 w-48 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center group-hover:scale-[1.02] transition-all duration-200 shadow-md">
                                  <img
                                    src={ensureAbsoluteUrl(
                                      answer.value as string,
                                    )}
                                    alt={field.label}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors rounded-xl" />
                              </div>
                            ) : (
                              <a
                                href={ensureAbsoluteUrl(answer.value)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 bg-primary-100 rounded-xl hover:bg-primary-200 transition-all group w-fit max-w-full"
                              >
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500/10">
                                  <FileText className="h-4 w-4 text-primary-600" />
                                </div>
                                <span className="font-medium text-foreground truncate text-xs">
                                  {getFileName(answer.value)}
                                </span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
                              </a>
                            )
                          ) : (
                            <div className="whitespace-pre-wrap">
                              {formatAnswerValue(answer?.value)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Image Zoom Modal */}
          <Dialog
            open={!!selectedImage}
            onOpenChange={(open: boolean) => !open && setSelectedImage(null)}
          >
            <DialogContent className="max-w-[95vw] max-h-[95vh] p-1 border-none bg-transparent shadow-none [&>button]:hidden">
              <div className="relative w-full h-full flex items-center justify-center group">
                <img
                  src={ensureAbsoluteUrl(selectedImage) || ""}
                  alt="Zoomed attachment"
                  className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl bg-black/20"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all backdrop-blur-md"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </BoneyardSkeleton>
  );
}
