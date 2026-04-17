import { NextRequest, NextResponse } from "next/server";
import { resolveReferralPublic, trackReferralClick } from "@/lib/api/referralApi";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function destination(entityType: string, slug: string) {
  if (entityType === "HACKATHON") return `/hackathons/${slug}`;
  if (entityType === "EVENT") return `/events/${slug}`;
  return `/festivals/${slug}`;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ code: string }> },
) {
  const { code } = await props.params;
  const baseUrl = new URL("/", request.url);
  try {
    const resolved = await resolveReferralPublic(code);
    const redirectPath = destination(resolved.entityType, resolved.slug);
    const response = NextResponse.redirect(new URL(redirectPath, baseUrl), 302);
    response.cookies.set("oppskills_ref", code, {
      path: "/",
      maxAge: THIRTY_DAYS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    });

    void trackReferralClick({
      code,
      source: request.headers.get("referer") ?? undefined,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/", baseUrl), 302);
  }
}
