"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FloatingLabelInput } from "@/components/ui/derived/FloatingInput";
import { getClerkErrorMessage } from "@/lib/utils";
import { useQueryState } from "nuqs";

export default function Login({
  setIsOpenLogin,
}: {
  setIsOpenLogin: (mode: boolean) => void;
}) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsSecondFactor, setNeedsSecondFactor] = useState(false);
  const [secondFactorCode, setSecondFactorCode] = useState("");
  const [secondFactorError, setSecondFactorError] = useState("");
  const [, setAuthMode] = useQueryState("auth");

  const completeSignIn = async (sessionId: string | null | undefined) => {
    if (!sessionId) {
      toast.error("Sign in completed but no session was returned");
      return;
    }
    if (!setActive) {
      toast.error("Unable to activate session. Please try again.");
      return;
    }
    await setActive({ session: sessionId });
    toast.success("Welcome back!");
    setIsOpenLogin(false);
    router.refresh();
  };

  const handleSecondFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;
    if (!secondFactorCode) {
      toast.error("Enter verification code");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: "email_code",
        code: secondFactorCode,
      });

      if (result.status === "complete") {
        await completeSignIn(result.createdSessionId);
      } else {
        toast.error("Verification is not complete yet. Please try again.");
      }
    } catch (err: unknown) {
      setSecondFactorError(getClerkErrorMessage(err, "Invalid verification code"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!email || !password) {
      toast.error("Please provide email and password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.create({
        strategy: "password",
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await completeSignIn(result.createdSessionId);
      } else if (result.status === "needs_second_factor") {
        const supportsEmailCode = (result.supportedSecondFactors || []).some(
          (factor) => factor.strategy === "email_code"
        );
        if (supportsEmailCode) {
          await signIn.prepareSecondFactor({ strategy: "email_code" });
          setNeedsSecondFactor(true);
          toast.info("Verification code sent to your email");
        } else {
          toast.error(
            "Your account requires multi-factor verification not supported in this form."
          );
        }
      } else if (result.status === "needs_first_factor") {
        toast.error(
          "This account may not have a password yet. Continue with Google or add a password from profile."
        );
      } else {
        toast.error("Sign in could not be completed. Please try another method.");
      }
    } catch (err: unknown) {
      console.log("Login error", err);
      toast.error(getClerkErrorMessage(err, "Invalid credentials"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {needsSecondFactor ? (
        <form onSubmit={handleSecondFactorSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <FloatingLabelInput
              id="verification_code"
              type="text"
              label="Verification Code"
              value={secondFactorCode}
              onChange={(e) => {
                setSecondFactorCode(e.target.value);
                setSecondFactorError("");
              }}
            />
            {secondFactorError && (
              <p className="text-red-500 text-sm font-medium mt-1">
                {secondFactorError}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full rounded-full py-6 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify <ChevronRight />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <FloatingLabelInput
              id="email"
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <FloatingLabelInput
              className="text-5xl"
              id="password"
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAuthMode("forgot-password")}
                className="text-sm text-neutral-600 hover:text-primary-600 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full rounded-full py-6 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue <ChevronRight />
          </Button>
        </form>
      )}
    </div>
  );
}
