import { readFile } from "fs/promises";
import path from "path";
import { JSDOM } from "jsdom";
import { NextRequest, NextResponse } from "next/server";
import QRCodeStyling from "qr-code-styling";
import sharp from "sharp";

import { getOppSkillsStyledQrOptions } from "@/lib/oppSkillsStyledQrOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseSize(param: string | null): number {
  const n = parseInt(param ?? "1024", 10);
  if (Number.isNaN(n)) return 1024;
  return Math.min(Math.max(n, 64), 2048);
}

/**
 * Renders the OppSkills styled QR (same as the dashboard / event pass) as PNG.
 * Query: `token` (event pass validation UUID) — encodes `origin/pass/validate/:token`.
 *        `size` (64–2048, default 1024) for output pixel width/height.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token || !UUID_RE.test(token)) {
    return new NextResponse("Invalid or missing token", { status: 400 });
  }

  const size = parseSize(searchParams.get("size"));
  const origin = request.nextUrl.origin;
  const data = `${origin}/pass/validate/${token}`;

  let logofDataUrl: string;
  try {
    const logofPath = path.join(process.cwd(), "public", "logof.png");
    const buf = await readFile(logofPath);
    logofDataUrl = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return new NextResponse("Watermark asset missing", { status: 500 });
  }

  let png: Buffer;
  try {
    const qr = new QRCodeStyling({
      ...getOppSkillsStyledQrOptions({ data, size, image: logofDataUrl }),
      jsdom: JSDOM,
    });

    const raw = await qr.getRawData("svg");
    if (raw == null) {
      return new NextResponse("Failed to render QR", { status: 500 });
    }
    const svg = Buffer.isBuffer(raw) ? raw : Buffer.from(await (raw as Blob).arrayBuffer());
    png = await sharp(svg, { density: 300 }).png().toBuffer();
  } catch (e) {
    console.error("styled-png", e);
    return new NextResponse("QR generation failed", { status: 500 });
  }

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, s-maxage=300, max-age=120",
    },
  });
}
