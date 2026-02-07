"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  CalendarDays,
  Building2,
  Mail,
  Ticket,
  ShieldCheck,
  AlertTriangle,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { lookupPassByToken, validateEventPass } from "@/lib/api/eventApi";
import type { PublicPassLookupDto, ScanResultDto } from "@oppskills/types";

export default function ValidatePassPage() {
  const params = useParams();
  const token = params.token as string;
  const { getToken, isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [validationResult, setValidationResult] =
    useState<ScanResultDto | null>(null);

  // Protected lookup - requires auth
  const {
    data: passData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pass-lookup", token],
    queryFn: async () => {
      const authToken = await getToken();
      if (!authToken) throw new Error("Authentication required");
      return lookupPassByToken(authToken, token);
    },
    enabled: authLoaded && isSignedIn && !!token,
    retry: false,
  });

  // Validation mutation
  const validateMutation = useMutation({
    mutationFn: async () => {
      const authToken = await getToken();
      if (!authToken) throw new Error("Authentication required");
      if (!passData?.eventId) throw new Error("Event ID not found");
      return validateEventPass(authToken, passData.eventId, token);
    },
    onSuccess: (result) => {
      setValidationResult(result);
      queryClient.setQueryData(["pass-lookup", token], (old: any) => ({
        ...old,
        isUsed: result.pass.isUsed,
        scannedAt: result.pass.scannedAt,
        scannedByName: result.pass.scannedBy?.name,
      }));
      if (result.wasAlreadyUsed) {
        toast.warning("Pass Already Used", {
          description: result.message,
        });
      } else {
        toast.success("Pass Validated!", {
          description: "Entry granted successfully.",
        });
      }
    },
    onError: (err: any) => {
      const message =
        err.response?.data?.message || err.message || "Validation failed";
      toast.error("Validation Failed", { description: message });
    },
  });

  // 1. Initial Loading State (Checking Auth)
  if (!authLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Not Signed In State
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full shadow-xl border-t-4 border-t-primary">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Organizer Access Only</h1>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              To validate participant passes, you must be signed in as an
              authorized event organizer or manager.
            </p>
            <Button
              asChild
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              <a
                href={`/sign-in?redirect_url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
              >
                Sign In to Validate
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Loading Pass Data State
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm font-medium text-muted-foreground">
            Checking pass permissions...
          </p>
        </div>
      </div>
    );
  }

  // 4. Error / Forbidden / Not Found State
  if (error || !passData) {
    const isForbidden = (error as any)?.response?.status === 403;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
        <Card className="max-w-md w-full shadow-lg">
          <CardContent className="pt-10 pb-10 text-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              {isForbidden ? (
                <ShieldCheck className="w-10 h-10 text-destructive" />
              ) : (
                <XCircle className="w-10 h-10 text-destructive" />
              )}
            </div>
            <h1 className="text-2xl font-bold mb-3">
              {isForbidden ? "Access Denied" : "Pass Not Found"}
            </h1>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              {isForbidden
                ? "You are logged in, but you don't have permission to scan passes for this event. Please contact the event owner."
                : "This QR code is invalid or the pass does not exist in our records."}
            </p>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventDate = format(new Date(passData.event.startDate), "MMMM dd, yyyy");
  const eventTime = format(new Date(passData.event.startDate), "hh:mm a");
  const isUsed = passData.isUsed;
  const scannedAt = passData.scannedAt;
  const scannedByName = passData.scannedByName;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-6 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Compact Header */}
        <div className="flex items-center justify-between mb-2">
          <Image
            src="/logo.svg"
            alt="OppSkills"
            width={100}
            height={25}
            className="opacity-80"
          />
          <Badge
            variant="outline"
            className="text-[10px] tracking-widest opacity-60"
          >
            SCANNER V2
          </Badge>
        </div>

        {/* PRIMARY ACTION: MARK AS USED (Promoted to top) */}
        {!isUsed && (
          <Card className="border-2 border-primary shadow-xl shadow-primary/10 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <CardContent className="p-0">
              <Button
                onClick={() => validateMutation.mutate()}
                disabled={validateMutation.isPending}
                className="w-full h-20 text-xl font-bold rounded-none flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 transition-all active:scale-95"
              >
                {validateMutation.isPending ? (
                  <>
                    <Loader2 className="w-7 h-7 animate-spin" />
                    VALIDATING...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-7 h-7" />
                    MARK AS USED
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ALREADY USED STATUS - Redesigned */}
        {isUsed && (
          <Card className="relative overflow-hidden border-0 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10 dark:from-amber-900/20 dark:via-orange-900/10 dark:to-red-900/20" />

            {/* Animated Border Glow */}
            <div className="absolute inset-0 border-2 border-amber-500/30 dark:border-amber-400/20 rounded-lg animate-pulse" />

            <CardContent className="relative p-4">
              {/* Icon with Animated Ring */}
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 rounded-full bg-amber-500/20 dark:bg-amber-400/10 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-500 dark:to-orange-600 shadow-lg shadow-amber-500/50 flex items-center justify-center">
                  <AlertTriangle
                    className="w-10 h-10 text-white drop-shadow-lg"
                    strokeWidth={2.5}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-center w-full">

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 dark:bg-amber-900/40 border border-amber-500/30 dark:border-amber-400/20 mb-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                  <span className="text-xs font-black tracking-widest text-amber-700 dark:text-amber-300 uppercase">
                    Already Used
                  </span>
                </div>
              </div>



              {/* Details Card */}
              <div className="mt-2 p-4 rounded-xl bg-background/60 dark:bg-background/40 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/50 shadow-inner">
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold">
                      Scanned on {format(new Date(scannedAt!), "MMMM dd, yyyy")}{" "}
                      at {format(new Date(scannedAt!), "hh:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="font-semibold">
                      Validated by{" "}
                      <span className="text-foreground font-bold">
                        {scannedByName || "Organizer"}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-amber-500/5 dark:bg-amber-400/5 blur-2xl" />
              <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full bg-orange-500/5 dark:bg-orange-400/5 blur-2xl" />
            </CardContent>
          </Card>
        )}

        {/* Participant Info Card */}
        <Card className="shadow-md">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 opacity-70">
              <User className="w-4 h-4" />
              Participant Info
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center gap-5">
              <div className="relative">
                {passData.participant.imageUrl ? (
                  <Image
                    src={passData.participant.imageUrl}
                    alt={passData.participant.name}
                    width={80}
                    height={80}
                    className="rounded-2xl object-cover border-2 border-muted shadow-sm"
                    unoptimized
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                    <User className="w-10 h-10 text-muted-foreground/40" />
                  </div>
                )}
                {/* Status Indicator */}
                <div
                  className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-background flex items-center justify-center shadow-md ${isUsed ? "bg-amber-500" : "bg-green-500"}`}
                >
                  {isUsed ? (
                    <AlertTriangle className="w-3 h-3 text-white" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-2xl tracking-tight leading-tight">
                  {passData.participant.name}
                </h3>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate max-w-[200px]">
                      {passData.participant.email}
                    </span>
                  </div>
                  {passData.participant.collegeName && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {passData.participant.collegeName}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-muted-foreground/10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                  Ticket ID
                </span>
                <span className="font-mono text-base font-bold">
                  {passData.ticketId}
                </span>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-[10px] px-2 py-0"
              >
                #TOKEN-{token.slice(-4).toUpperCase()}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Event Info Card */}
        <Card className="shadow-md">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 opacity-70">
              <Calendar className="w-4 h-4" />
              Event Context
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            <h3 className="font-bold text-lg mb-1">{passData.event.name}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {eventDate}
              </span>
              <span className="flex items-center gap-1">
                <Loader2 className="w-3.5 h-3.5" />
                {eventTime}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="pt-4 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Authorized Access for Organizer:{" "}
            <strong>{user?.primaryEmailAddress?.emailAddress}</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
