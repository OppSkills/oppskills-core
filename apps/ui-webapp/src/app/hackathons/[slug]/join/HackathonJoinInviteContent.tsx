"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2, Users, AlertCircle } from "lucide-react";
import {
  getPublicHackathonBySlug,
  getTeamInvitePreview,
} from "@/lib/api/hackathonApi";
import { checkMyHackathonTeam } from "@/lib/api/teamApi";
import type { TeamInvitePreviewResponse } from "@oppskills/types/frontend";
import { isAxiosError } from "axios";

type HackathonPublic = { id: string; name: string; slug: string };

function registrationClosedLabel(
  reason?: TeamInvitePreviewResponse["registrationClosedReason"],
): string {
  switch (reason) {
    case "HACKATHON_NOT_PUBLIC":
      return "This competition is not open for registration.";
    case "REGISTRATION_PAUSED":
      return "Registration is paused for this competition.";
    case "DEADLINE_PASSED":
      return "The registration deadline has passed.";
    default:
      return "Registration is not available for this competition.";
  }
}

export function HackathonJoinInviteContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const codeRaw = searchParams.get("code") ?? "";

  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { openSignIn, openSignUp } = useClerk();

  const [preview, setPreview] = useState<TeamInvitePreviewResponse | null>(
    null,
  );
  const [previewError, setPreviewError] = useState<"invalid" | "network" | null>(
    null,
  );
  const [hackathon, setHackathon] = useState<HackathonPublic | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [existingTeam, setExistingTeam] = useState<boolean | null>(null);
  const [checkingTeam, setCheckingTeam] = useState(false);

  const normalizedCode = codeRaw.trim().toUpperCase();

  const redirectBackUrl = useCallback(() => {
    if (typeof window === "undefined") return "/";
    return `${window.location.origin}/hackathons/${encodeURIComponent(slug)}/join?code=${encodeURIComponent(normalizedCode)}`;
  }, [slug, normalizedCode]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadingPreview(true);
      setPreview(null);
      setPreviewError(null);

      try {
        const h = (await getPublicHackathonBySlug(
          slug,
        )) as HackathonPublic | null;
        if (!cancelled) {
          setHackathon(h ?? null);
        }
      } catch {
        if (!cancelled) setHackathon(null);
      }

      if (!normalizedCode) {
        if (!cancelled) {
          setPreviewError("invalid");
          setLoadingPreview(false);
        }
        return;
      }

      try {
        const data = await getTeamInvitePreview(normalizedCode, slug);
        if (!cancelled) {
          setPreview(data);
          setPreviewError(null);
        }
      } catch (e: unknown) {
        if (cancelled) return;
        if (isAxiosError(e) && e.response?.status === 404) {
          setPreviewError("invalid");
        } else {
          setPreviewError("network");
        }
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, normalizedCode]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !hackathon?.id) {
      setExistingTeam(null);
      return;
    }

    let cancelled = false;
    setCheckingTeam(true);

    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const team = await checkMyHackathonTeam(token, hackathon.id);
        if (!cancelled) setExistingTeam(!!team);
      } catch {
        if (!cancelled) setExistingTeam(null);
      } finally {
        if (!cancelled) setCheckingTeam(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, hackathon?.id, getToken]);

  const handleSignIn = () => {
    const url = redirectBackUrl();
    openSignIn({
      fallbackRedirectUrl: url,
      signUpFallbackRedirectUrl: url,
    });
  };

  const handleSignUp = () => {
    const url = redirectBackUrl();
    openSignUp({
      fallbackRedirectUrl: url,
      signInFallbackRedirectUrl: url,
    });
  };

  const canAttemptJoin =
    preview &&
    preview.registrationOpen &&
    !preview.teamFull &&
    hackathon?.id;

  const handleContinue = () => {
    if (!canAttemptJoin || !hackathon) return;
    const q = new URLSearchParams({
      hackathonId: hackathon.id,
      slug,
      mode: "JOIN",
      invite: normalizedCode,
    });
    router.push(`/team-register?${q.toString()}`);
  };

  if (loadingPreview) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading invite…</p>
      </div>
    );
  }

  if (!normalizedCode || previewError === "invalid") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="text-2xl font-bold">Invalid or expired invite</h1>
        <p className="text-muted-foreground">
          This team invite link is not valid. Check the link or ask the team
          leader for a new one.
        </p>
        {hackathon ? (
          <Button asChild variant="outline">
            <Link href={`/hackathons/${slug}`}>Back to competition</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href="/hackathons">Browse competitions</Link>
          </Button>
        )}
      </div>
    );
  }

  if (previewError === "network") {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">Please refresh and try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Users className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Join {preview.teamName}
        </h1>
        <p className="text-muted-foreground">
          You&apos;ve been invited to compete in{" "}
          <span className="font-medium text-foreground">
            {preview.hackathonName}
          </span>
          .
        </p>
        {preview.requiresPayment ? (
          <p className="text-sm text-muted-foreground">
            This competition may require an entry fee as part of registration.
          </p>
        ) : null}
      </div>

      {!preview.registrationOpen && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
          {registrationClosedLabel(preview.registrationClosedReason)}
        </div>
      )}

      {preview.teamFull && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          This team is full. Ask the leader for another team or create your
          own from the competition page.
        </div>
      )}

      {isSignedIn && checkingTeam && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isSignedIn && !checkingTeam && existingTeam && (
        <div className="rounded-lg border bg-muted/40 p-4 text-center space-y-3">
          <p className="text-sm">
            You&apos;re already registered for this competition.
          </p>
          <Button asChild>
            <Link href={`/hackathons/${slug}/team`}>View my team</Link>
          </Button>
        </div>
      )}

      {isSignedIn && !checkingTeam && !existingTeam && (
        <div className="space-y-3">
          <Button
            className="w-full"
            size="lg"
            disabled={!canAttemptJoin}
            onClick={handleContinue}
          >
            Continue to join
          </Button>
          {!canAttemptJoin && (
            <p className="text-center text-xs text-muted-foreground">
              Fix the issues above to continue.
            </p>
          )}
        </div>
      )}

      {!isLoaded ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !isSignedIn ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">
            Sign in or create an account to accept this invite. You&apos;ll
            return here automatically after signing in.
          </p>
          <Button className="w-full" size="lg" onClick={handleSignIn}>
            Sign in
          </Button>
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleSignUp}
          >
            Create account
          </Button>
        </div>
      ) : null}

      <div className="text-center">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/hackathons/${slug}`}>Back to competition</Link>
        </Button>
      </div>
    </div>
  );
}
