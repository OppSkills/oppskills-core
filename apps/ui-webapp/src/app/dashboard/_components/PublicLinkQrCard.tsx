"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Download, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { cn } from "@/lib/utils";

type Props = {
  url: string;
  title?: string;
  className?: string;
  watermarkSrc?: string;
  downloadFileName?: string;
};

function clampFileName(name: string) {
  const safe = name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .slice(0, 80);
  return safe.length > 0 ? safe : "qr-code";
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default function PublicLinkQrCard({
  url,
  title = "Public QR Code",
  className,
  watermarkSrc = "/logof.png",
  downloadFileName,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const fileName = useMemo(() => {
    if (downloadFileName) return clampFileName(downloadFileName);
    return clampFileName(title);
  }, [downloadFileName, title]);

  const handleDownload = useCallback(async () => {
    if (isDownloading) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;

    setIsDownloading(true);
    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);
      const svgBlob = new Blob([svgString], {
        type: "image/svg+xml;charset=utf-8",
      });
      const svgUrl = URL.createObjectURL(svgBlob);

      const qrImg = new window.Image();
      qrImg.decoding = "async";
      qrImg.src = svgUrl;

      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("Failed to load QR image"));
      });

      const size = Math.max(qrImg.width, qrImg.height, 512);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context not available");

      // White background (so QR is scannable in dark mode)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);

      // Draw QR
      ctx.drawImage(qrImg, 0, 0, size, size);

      // Draw watermark in center
      const wm = new window.Image();
      wm.decoding = "async";
      wm.crossOrigin = "anonymous";
      wm.src = watermarkSrc;

      await new Promise<void>((resolve) => {
        wm.onload = () => resolve();
        wm.onerror = () => resolve(); // watermark is optional; still download QR
      });

      if (wm.naturalWidth > 0) {
        const wmSize = Math.floor(size * 0.18);
        const padding = Math.floor(size * 0.03);
        const boxSize = wmSize + padding * 2;
        const boxX = Math.floor(size / 2 - boxSize / 2);
        const boxY = Math.floor(size / 2 - boxSize / 2);
        const x = Math.floor(size / 2 - wmSize / 2);
        const y = Math.floor(size / 2 - wmSize / 2);

        // Match the in-card watermark container: bg-white/75 with rounded corners
        ctx.globalAlpha = 0.75;
        drawRoundedRect(ctx, boxX, boxY, boxSize, boxSize, Math.floor(size * 0.02));
        ctx.fillStyle = "#ffffff";
        ctx.fill();

        ctx.globalAlpha = 0.85;
        ctx.drawImage(wm, x, y, wmSize, wmSize);
        ctx.globalAlpha = 1;
      }

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${fileName}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      URL.revokeObjectURL(svgUrl);
    } finally {
      setIsDownloading(false);
    }
  }, [fileName, isDownloading, watermarkSrc]);

  return (
    <div
      className={cn(
        "group relative box-border flex sm:aspect-square sm:w-fit max-w-full w-full aspect-auto flex-col items-center justify-center rounded-[20px] border border-primary/30 bg-background p-3 lg:bg-linear-to-l lg:from-primary-100 lg:to-neutral-100",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-primary/10">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="absolute right-2 top-2 z-20 flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-white/90 text-primary shadow-sm md:hidden"
          aria-label="Download QR code"
          title="Download QR"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>

        <QRCodeSVG
          value={url}
          size={110}
          level="H"
          includeMargin
          ref={(node) => {
            svgRef.current = node as unknown as SVGSVGElement | null;
          }}
          className="block"
        />

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-xl bg-white/75 p-2 shadow-sm ring-1 ring-primary/10">
            <Image
              src={watermarkSrc}
              alt="OppSkills"
              width={44}
              height={44}
              className="h-11 w-11 object-contain"
              priority={false}
            />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200 group-hover:opacity-100 md:flex">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-lg transition hover:scale-105 disabled:opacity-70"
            aria-label="Download QR code"
            title="Download QR"
          >
            {isDownloading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

