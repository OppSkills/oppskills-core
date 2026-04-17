import { NextRequest, NextResponse } from "next/server";
import { resolveReferralPublic, trackReferralClick } from "@/lib/api/referralApi";
import {
  buildReferralBridgeHtml,
  fetchReferralTargetShareOg,
} from "@/lib/referral/referralShareOg";

const THIRTY_DAYS = 60 * 60 * 24 * 30;

function destination(entityType: string, slug: string) {
  if (entityType === "HACKATHON") return `/hackathons/${slug}`;
  if (entityType === "EVENT") return `/events/${slug}`;
  return `/festivals/${slug}`;
}

/** Social preview fetchers: avoid counting link unfurl as a human “click”. */
function isLikelySocialPreviewBot(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const u = userAgent.toLowerCase();
  return (
    u.includes("whatsapp") ||
    u.includes("facebookexternalhit") ||
    u.includes("facebot") ||
    u.includes("twitterbot") ||
    u.includes("linkedinbot") ||
    u.includes("slackbot") ||
    u.includes("telegrambot") ||
    u.includes("discordbot") ||
    u.includes("pinterest")
  );
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ code: string }> },
) {
  const { code } = await props.params;
  const baseUrl = new URL("/", request.url);
  const origin = baseUrl.origin;
  const canonicalReferralUrl = new URL(`/r/${encodeURIComponent(code)}`, baseUrl).toString();

  try {
    const resolved = await resolveReferralPublic(code);
    const redirectPath = destination(resolved.entityType, resolved.slug);
    const redirectTo = new URL(redirectPath, baseUrl).toString();

    const entityOg = await fetchReferralTargetShareOg(resolved.entityType, resolved.slug);
    const og =
      entityOg ?? {
        title: "OppSkills",
        description: "College events, hackathons & competitions for students.",
        imageUrl: new URL("/og_poster.png", origin).toString(),
      };

    const html = buildReferralBridgeHtml({
      og,
      redirectTo,
      canonicalReferralUrl,
    });

    const response = new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // `private`: response sets a first-party cookie; avoid shared CDN caches that could drop Set-Cookie semantics.
        "Cache-Control": "private, max-age=0, must-revalidate",
      },
    });

    response.cookies.set("oppskills_ref", code, {
      path: "/",
      maxAge: THIRTY_DAYS,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false,
    });

    const ua = request.headers.get("user-agent");
    if (!isLikelySocialPreviewBot(ua)) {
      void trackReferralClick({
        code,
        source: request.headers.get("referer") ?? undefined,
      });
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", baseUrl), 302);
  }
}
