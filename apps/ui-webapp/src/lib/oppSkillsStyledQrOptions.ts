import type { Options } from "qr-code-styling";

/** Matches dashboard public link QR; shared by event pass, email attachments, and OG. */
export const OPPSKILLS_STYLED_QR_SIZES = {
  publicLinkDisplay: 120,
  publicLinkDownload: 1024,
  /** Fits `.event-pass-container .qr-code-vertical` (180×180) */
  eventPassDisplay: 180,
  emailAttachment: 1024,
  /** Embedded in `api/og/event-pass` ticket art (~200px on-card) */
  ogEmbed: 500,
} as const;

const DEFAULT_IMAGE = "/logof.png";

/**
 * Styling (dots, corner colors, center logo) is the same across public links and event passes.
 * Pass a logo URL, path, or `data:` URL for `image` (browser) or a base64 `data:` string on the server.
 */
export function getOppSkillsStyledQrOptions(args: {
  data: string;
  size: number;
  image?: string;
}): Options {
  const { data, size, image = DEFAULT_IMAGE } = args;
  return {
    width: size,
    height: size,
    type: "svg",
    data,
    image,
    margin: 0,
    qrOptions: {
      errorCorrectionLevel: "H",
    },
    dotsOptions: {
      color: "#000000",
      type: "dots",
    },
    cornersSquareOptions: {
      color: "#423072",
      type: "extra-rounded",
    },
    cornersDotOptions: {
      color: "#000000",
      type: "dot",
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      hideBackgroundDots: true,
      margin: 6,
      imageSize: 0.35,
    },
  };
}
