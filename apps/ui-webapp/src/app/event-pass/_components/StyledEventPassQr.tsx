"use client";

import { useEffect, useRef } from "react";

import {
  getOppSkillsStyledQrOptions,
  OPPSKILLS_STYLED_QR_SIZES,
} from "@/lib/oppSkillsStyledQrOptions";

type Props = {
  validationUrl: string;
  className?: string;
  /** Logo for the QR center; default matches dashboard public link. */
  watermarkSrc?: string;
};

export function StyledEventPassQr({
  validationUrl,
  className,
  watermarkSrc = "/logof.png",
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const qrRef = useRef<{
    update: (options: Record<string, unknown>) => void;
    append: (container: HTMLElement) => void;
  } | null>(null);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const el = ref.current;
      if (!el) return;

      const { default: QRCodeStyling } = await import("qr-code-styling");
      if (!alive) return;

      const size = OPPSKILLS_STYLED_QR_SIZES.eventPassDisplay;
      if (!qrRef.current) {
        qrRef.current = new QRCodeStyling(
          getOppSkillsStyledQrOptions({
            data: validationUrl,
            size,
            image: watermarkSrc,
          }),
        );
        el.innerHTML = "";
        qrRef.current.append(el);
        return;
      }
      qrRef.current.update({ data: validationUrl, image: watermarkSrc });
    };

    void run();
    return () => {
      alive = false;
    };
  }, [validationUrl, watermarkSrc]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height: "100%" }}
      aria-hidden
    />
  );
}
