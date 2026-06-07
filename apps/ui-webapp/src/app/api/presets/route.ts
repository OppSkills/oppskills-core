import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const presetDir = path.join(
      process.cwd(),
      "public",
      "illustrations",
      "community",
      "preset",
    );

    if (!fs.existsSync(presetDir)) {
      console.warn("Preset directory not found:", presetDir);
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(presetDir);
    const imageExtensions = [".png", ".jpg", ".jpeg", ".svg", ".webp"];
    const images = files.filter((file) =>
      imageExtensions.includes(path.extname(file).toLowerCase()),
    );

    return NextResponse.json(images);
  } catch (error) {
    console.error("Failed to read preset directory:", error);
    return NextResponse.json([], { status: 500 });
  }
}
