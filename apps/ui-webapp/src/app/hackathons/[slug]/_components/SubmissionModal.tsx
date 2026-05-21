"use client";

import React, { useState, useCallback } from "react";
import { Round } from "./types";
import { RoundSubmissionInfo } from "./RoundsTimeline";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, X, FileText, Image, File } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { upsertRoundSubmission } from "@/lib/api/hackathonApi";
import { presignDocumentUpload } from "@/lib/api/mediaApi";
import { uploadDocumentToS3PresignedPost } from "@/lib/uploads/uploadDocumentToS3";
import { getApiErrorMessage } from "@/lib/utils";

interface SubmissionModalProps {
  round: Round;
  competitionSlug: string;
  existingSubmission?: RoundSubmissionInfo;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UploadedFile {
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

const MAX_FILES = 3;
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
];

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("pdf")) return FileText;
  return File;
}

export function SubmissionModal({
  round,
  competitionSlug,
  existingSubmission,
  onClose,
  onSuccess,
}: SubmissionModalProps) {
  const { getToken } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>(
    existingSubmission?.payload.files || [],
  );
  const [note, setNote] = useState(existingSubmission?.payload.note || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedTypesFromConfig = round.submissionConfig?.allowedFileTypes;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      if (files.length + selectedFiles.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      for (const file of selectedFiles) {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(`${file.name} exceeds 50MB limit`);
          return;
        }

        // If config has allowed types, check against them.
        // The backend might send extensions (e.g. "pdf") or MIME types.
        if (allowedTypesFromConfig && allowedTypesFromConfig.length > 0) {
          const isAllowed = allowedTypesFromConfig.some((type) => {
            const lowerType = type.toLowerCase();
            return (
              file.type.toLowerCase().includes(lowerType) ||
              file.name.toLowerCase().endsWith(`.${lowerType}`)
            );
          });
          if (!isAllowed) {
            toast.error(
              `${file.name} is not an allowed file type (${allowedTypesFromConfig.join(", ")})`,
            );
            return;
          }
        } else if (!ALLOWED_TYPES.includes(file.type)) {
          toast.error(`${file.name} has unsupported file type`);
          return;
        }
      }

      setIsUploading(true);
      try {
        const token = await getToken();
        if (!token) {
          toast.error("Please sign in to upload files");
          return;
        }

        const uploadedFiles: UploadedFile[] = [];
        for (const file of selectedFiles) {
          // 1. Get presigned POST policy from backend
          const presign = await presignDocumentUpload(token, {
            purpose: "OPPORTUNITY_ATTACHMENT",
            mimeType: file.type,
            fileName: file.name,
          });

          // 2. Upload directly to S3
          await uploadDocumentToS3PresignedPost({
            presign,
            file,
          });

          uploadedFiles.push({
            url: presign.publicUrl,
            name: file.name,
            mimeType: file.type,
            size: file.size,
          });
        }

        setFiles((prev) => [...prev, ...uploadedFiles]);
        toast.success("Files uploaded successfully");
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(getApiErrorMessage(error, "Failed to upload files"));
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [files.length, getToken],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Please sign in to submit");
        return;
      }

      await upsertRoundSubmission(token, competitionSlug, round.id, {
        files,
        note: note || undefined,
      });

      toast.success("Submission saved successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to save submission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {existingSubmission?.submittedAt ? "Edit Submission" : "Submit"} -{" "}
            {round.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="mb-2 block">
              Upload Files (max {MAX_FILES}, up to 50MB each)
            </Label>
            <p className="text-xs text-neutral-500 mb-2">
              Accepted:{" "}
              {allowedTypesFromConfig && allowedTypesFromConfig.length > 0
                ? allowedTypesFromConfig.join(", ").toUpperCase()
                : "PDF, PPT/PPTX, Images (PNG, JPG)"}
            </p>

            <div className="border-2 border-dashed border-neutral-200 rounded-lg p-4">
              {files.length > 0 && (
                <div className="space-y-2 mb-4">
                  {files.map((file, index) => {
                    const Icon = getFileIcon(file.mimeType);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-neutral-50 rounded-lg p-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-neutral-400 flex-shrink-0">
                            ({(file.size / 1024 / 1024).toFixed(1)}MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {files.length < MAX_FILES && (
                <label className="flex flex-col items-center justify-center cursor-pointer py-4">
                  <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                  <span className="text-sm text-neutral-600">
                    {isUploading
                      ? "Uploading..."
                      : "Click to upload or drag files"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept={
                      allowedTypesFromConfig &&
                      allowedTypesFromConfig.length > 0
                        ? allowedTypesFromConfig
                            .map((t) => `.${t.toLowerCase()}`)
                            .join(",")
                        : ALLOWED_TYPES.join(",")
                    }
                    multiple
                    onChange={handleFileSelect}
                    disabled={isUploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="note" className="mb-2 block">
              Note (optional)
            </Label>
            <Textarea
              id="note"
              placeholder="Add any notes about your submission..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || isUploading}>
            {isSubmitting
              ? "Submitting..."
              : existingSubmission?.submittedAt
                ? "Update"
                : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
