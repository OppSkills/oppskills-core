"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { generateClerkUsername, getClerkErrorMessage } from "@/lib/utils";

/**
 * Completes an OAuth-based sign-up when Clerk requires additional fields.
 *
 * Example: if `username` is required in the Clerk Dashboard, OAuth sign-ups will
 * be "incomplete" until a username is set.
 *
 * This page is used as the `continueSignUpUrl` target from `/sso-callback`.
 */
export default function CompleteProfilePage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const hasAttemptedRef = useRef(false);
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!isLoaded) return;
      if (!signUp) return;
      if (hasAttemptedRef.current) return;

      hasAttemptedRef.current = true;
      setIsWorking(true);

      try {
        /**
         * Attempt to set a generated username. If Clerk requires username, this
         * should unblock the sign-up completion for OAuth users.
         */
        const username = generateClerkUsername({
          firstName: signUp.firstName ?? "",
          lastName: signUp.lastName ?? "",
        });

        await signUp.update({ username });

        // If sign-up completed, activate the created session and go to dashboard.
        if (signUp.status === "complete") {
          const sessionId = signUp.createdSessionId;
          if (typeof sessionId === "string" && sessionId.length > 0) {
            await setActive({ session: sessionId });
          }
          router.push("/dashboard");
          return;
        }

        /**
         * If still not complete, Clerk requires more fields beyond username.
         * In that case, fall back to Clerk's hosted flow by sending the user to
         * the sign-up page (or you can build a richer completion UI here).
         */
        toast.error("Please complete the remaining sign up steps.");
        router.push("/");
      } catch (error: unknown) {
        toast.error(getClerkErrorMessage(error, "Failed to complete sign up"));
        router.push("/");
      } finally {
        setIsWorking(false);
      }
    };

    void run();
  }, [isLoaded, router, setActive, signUp]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-6">
      <div id="clerk-captcha"></div>
      <Loader2 className="h-6 w-6 animate-spin" />
      <p className="text-sm text-muted-foreground text-center">
        {isWorking ? "Completing your profile..." : "Preparing sign up..."}
      </p>
    </div>
  );
}
