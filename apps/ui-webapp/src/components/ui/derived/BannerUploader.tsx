import React from "react";
import { Upload, FileEdit, Trophy } from "lucide-react";
import { cn, normalizeUrl, isValidUrl } from "@/lib/utils";

interface BannerUploaderProps {
    imageUrl?: string;
    onUpload: (file: File | null) => void;
    isUploading: boolean;
    inputId: string;
    className?: string;
    emptyState?: React.ReactNode;
}

export default function BannerUploader({
    imageUrl,
    onUpload,
    isUploading,
    inputId,
    className,
    emptyState,
}: BannerUploaderProps) {
    const normalizedUrl = normalizeUrl(imageUrl);
    const isValid = isValidUrl(normalizedUrl);

    return (
        <div
            className={cn(
                "w-full relative h-[220px] overflow-hidden rounded-xl flex items-center justify-center bg-muted group border border-border/50",
                className
            )}
        >
            {isValid ? (
                <img
                    src={normalizedUrl!}
                    alt="Banner"
                    className="w-full h-full object-cover"
                />
            ) : (
                emptyState || (
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Trophy className="w-12 h-12 opacity-20" />
                        <span className="text-sm opacity-50">No banner image</span>
                    </div>
                )
            )}

            <label
                htmlFor={inputId}
                className={cn(
                    "absolute bottom-3 right-3 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-black/70 transition-colors cursor-pointer",
                    isUploading ? "opacity-60 cursor-not-allowed" : ""
                )}
                aria-disabled={isUploading}
            >
                <p className="text-white px-4 py-1.5 flex items-center gap-2 text-xs font-medium">
                    {imageUrl ? (
                        <>
                            <FileEdit className="w-3 h-3" />
                            {isUploading ? "Uploading…" : "Change Banner"}
                        </>
                    ) : (
                        <>
                            <Upload className="w-3 h-3" />
                            {isUploading ? "Uploading…" : "Upload"}
                        </>
                    )}
                </p>
            </label>

            <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    e.target.value = "";
                    onUpload(f);
                }}
            />
        </div>
    );
}
