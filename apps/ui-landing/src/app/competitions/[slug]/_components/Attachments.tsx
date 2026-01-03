import { FileText, Download } from "lucide-react";
import type { Attachment } from "./types";

interface AttachmentsProps {
  attachments: Attachment[];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function getFileExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toUpperCase();
  return ext || "FILE";
}

export function Attachments({ attachments }: AttachmentsProps) {
  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Attachments</h2>
      <div className="grid gap-3">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            href={attachment.publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-secondary/20 border border-secondary/30 hover:bg-secondary/30 hover:border-primary/50 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/30 transition-colors">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-base group-hover:text-primary transition-colors">
                  {attachment.fileName || "Document"}
                </h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{getFileExtension(attachment.fileName || "")}</span>
                  {attachment.sizeBytes && (
                    <>
                      <span className="text-border">•</span>
                      <span>{formatFileSize(attachment.sizeBytes)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Download className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
}
