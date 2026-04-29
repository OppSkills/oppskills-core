"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";

import {
  getOppSkillsStyledQrOptions,
  OPPSKILLS_STYLED_QR_SIZES,
} from "@/lib/oppSkillsStyledQrOptions";
import { cn } from "@/lib/utils";

import RTooltip from "@/components/ui/Rtooltip";

type Props = {
  url: string;
  title?: string;
  className?: string;
  watermarkSrc?: string;
  downloadFileName?: string;
  itemName?: string;
  type?: "event" | "hackathon" | "festival";
  referralCode?: string;
};

function clampFileName(name: string) {
  const safe = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 80);
  return safe.length > 0 ? safe : "qr-code";
}

export default function PublicLinkQrCard({
  url,
  title = "Public QR Code",
  className,
  watermarkSrc = "/logof.png",
  downloadFileName,
  itemName = "",
  type = "event",
  referralCode,
}: Props) {
  const qrRef = useRef<{
    update: (options: Record<string, unknown>) => void;
    append: (container: HTMLElement) => void;
  } | null>(null);
  const qrDownloadRef = useRef<{
    update: (options: Record<string, unknown>) => void;
    download: (options?: { name?: string; extension?: "png" | "jpeg" | "webp" | "svg" }) => Promise<void>;
  } | null>(null);
  const qrContainerRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const finalUrl = useMemo(() => {
    if (referralCode) {
      const origin = typeof window !== "undefined" ? window.location.origin : "https://www.oppskills.com";
      return `${origin}/r/${referralCode}?source=op_qr`;
    }
    return url;
  }, [url, referralCode]);

  const fileName = useMemo(() => {
    if (downloadFileName) return clampFileName(downloadFileName);
    return clampFileName(title);
  }, [downloadFileName, title]);

  useEffect(() => {
    let mounted = true;

    const initQr = async () => {
      const container = qrContainerRef.current;
      if (!container) return;

      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (!mounted) return;

      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling(
          getOppSkillsStyledQrOptions({
            data: finalUrl,
            size: OPPSKILLS_STYLED_QR_SIZES.publicLinkDisplay,
            image: watermarkSrc,
          }),
        );
        container.innerHTML = "";
        qrRef.current.append(container);
      } else {
        qrRef.current.update({
          data: finalUrl,
          image: watermarkSrc,
        });
      }

      if (!qrDownloadRef.current) {
        qrDownloadRef.current = new QRCodeStyling(
          getOppSkillsStyledQrOptions({
            data: finalUrl,
            size: OPPSKILLS_STYLED_QR_SIZES.publicLinkDownload,
            image: watermarkSrc,
          }),
        );
      } else {
        qrDownloadRef.current.update({
          data: finalUrl,
          image: watermarkSrc,
        });
      }
    };

    void initQr();

    return () => {
      mounted = false;
    };
  }, [finalUrl, watermarkSrc]);

  const handleDownload = useCallback(async () => {
    if (isDownloading || !qrDownloadRef.current) return;
    setIsDownloading(true);
    try {
      await qrDownloadRef.current.download({
        name: fileName,
        extension: "png",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [fileName, isDownloading]);

  return (
    <div
      className={cn(
        "group relative box-border flex sm:w-fit max-w-full w-full h-full aspect-auto flex-col items-center justify-center rounded-[20px] border border-primary/30 bg-background p-3 lg:bg-linear-to-l lg:from-primary-100 lg:to-neutral-100",
        className,
      )}
    >
      <RTooltip
        side="right"
        className="max-w-[200px] text-center"
        content={
          <p className="text-xs">
            Download shareable QR code for: <span className="font-bold">{title || itemName}</span>
          </p>
        }
      >
        <div className="relative overflow-hidden rounded-2xl bg-white p-1 shadow-sm ring-1 ring-primary/10 cursor-help">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-white/90 text-primary shadow-sm md:hidden"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>

          <div className="rounded-lg bg-white">
            <div ref={qrContainerRef} className="size-[120px]" />
          </div>

          <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-lg transition hover:scale-105 disabled:opacity-70"
            >
              {isDownloading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </RTooltip>
    </div>
  );
}

