"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { FloatingLabelInput } from "@/components/ui/derived/FloatingInput";
import { getClerkErrorMessage } from "@/lib/utils";

export default function ForgotPassword({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    if (!email) {
      toast.error("Please provide your email address");
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep(2);
      toast.info("Verification code sent to your email");
    } catch (err: unknown) {
      console.error("Forgot password error", err);
      toast.error(getClerkErrorMessage(err, "Failed to send reset code"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded || !signIn) return;

    if (!code || !password) {
      toast.error("Please provide the code and your new password");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Password reset successful! Welcome back.");
        onSuccess();
      } else {
        console.error("Password reset incomplete", result);
        setCodeError("Something went wrong. Please try again.");
      }
    } catch (err: unknown) {
      console.error("Password reset error", err);
      setCodeError(getClerkErrorMessage(err, "Failed to reset password"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2 w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Sign In
      </button>

      {step === 1 ? (
        <form onSubmit={handleSendCode} className="grid gap-4">
          <div className="grid gap-2">
            <FloatingLabelInput
              id="forgot_email"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-full py-6 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Reset Code <ChevronRight />
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="grid gap-4">
          <div className="grid gap-2">
            <FloatingLabelInput
              id="reset_code"
              type="text"
              label="Verification Code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setCodeError("");
              }}
              required
            />
            {codeError && (
              <p className="text-red-500 text-sm font-medium mt-1">
                {codeError}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <FloatingLabelInput
              id="new_password"
              type="password"
              label="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full rounded-full py-6 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset Password <ChevronRight />
          </Button>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs text-center text-muted-foreground hover:underline"
          >
            Didn't receive a code? Try again
          </button>
        </form>
      )}
    </div>
  );
}
