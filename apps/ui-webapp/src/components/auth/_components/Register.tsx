"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, CheckIcon, Loader2, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getClerkErrorMessage } from "@/lib/utils";

import RTooltip from "@/components/ui/Rtooltip";
import { FloatingLabelInput } from "@/components/ui/derived/FloatingInput";
import { Input } from "@/components/ui/input";

export default function Register({
  setIsOpenLogin,
  onStepChange,
}: {
  setIsOpenLogin: (mode: boolean) => void;
  onStepChange?: (step: number) => void;
}) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  // UI State
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const updateStep = (newStep: number) => {
    setStep(newStep);
    onStepChange?.(newStep);
  };

  // Form States
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({ phone: "" });

  const [userDetails, setUserDetails] = useState({
    firstName: "",
    lastName: "",
    password: "",
    phone: "",
  });

  // Handlers
  const handleSendOtp = async () => {
    if (!isLoaded) return;
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
      });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      updateStep(2);
      toast.success("Verification code sent!");
    } catch (err: unknown) {
      console.log(JSON.stringify(err, null, 2));
      toast.error(getClerkErrorMessage(err, "Something went wrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      toast.success("Verification code resent!");
    } catch (err: unknown) {
      toast.error(getClerkErrorMessage(err, "Failed to resend code"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!isLoaded) return;
    if (!otp) return;

    setIsLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: otp,
      });

      if (completeSignUp.status !== "complete") {
        updateStep(3);
        toast.success("Email verified!");
      } else {
        updateStep(3);
      }
    } catch (err: unknown) {
      console.log(JSON.stringify(err, null, 2));
      toast.error(getClerkErrorMessage(err, "Invalid Code"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    if (!userDetails.firstName || !userDetails.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      // Update user details and complete registration
      // Capture the return value to get the fresh status
      const updatedSignUp = await signUp.update({
        firstName: userDetails.firstName,
        lastName: userDetails.lastName,
        password: userDetails.password,
        unsafeMetadata: {
          phone: userDetails.phone,
        },
      });

      // Check status from the returned object (not the potentially stale signUp)
      if (updatedSignUp.status === "complete") {
        const sessionId = updatedSignUp.createdSessionId;
        // Validate sessionId before calling setActive
        if (typeof sessionId === "string" && sessionId.length > 0) {
          await setActive({ session: sessionId });
          toast.success("Registration Successful!");
          setIsOpenLogin(false);
          router.refresh();
        } else {
          console.log("Session ID is missing:", sessionId);
          toast.error(
            "Registration completed but session could not be created. Please sign in."
          );
          setIsOpenLogin(false);
        }
      } else {
        console.log("Signup status:", updatedSignUp.status);
        toast.error("Need more information to complete registration");
      }
    } catch (err: unknown) {
      console.log(JSON.stringify(err, null, 2));
      toast.error(getClerkErrorMessage(err, "Registration failed"));
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation Step Click Handler
  const handleStepClick = (s: number) => {
    if (s < step) {
      updateStep(s);
    }
  };

  const stepName: Record<number, { name: string; icon: React.ReactNode }> = {
    1: {
      name: "Email",
      icon: <Mail />,
    },
    2: {
      name: "Verify",
      icon: <CheckIcon />,
    },
    3: {
      name: "Details",
      icon: <User />,
    },
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove non-digits
    value = value.replace(/\D/g, "");

    // Prevent leading zero
    if (value.startsWith("0")) {
      value = value.slice(1);
    }

    // Limit to 10 digits
    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    setUserDetails((prev) => ({ ...prev, phone: value }));

    // Live validation
    setErrors((prev) => ({
      ...prev,
      phone: validatePhone(value),
    }));
  };

  const validatePhone = (value: string) => {
    if (!value) return "Phone number is required";
    if (!/^[1-9][0-9]{9}$/.test(value))
      return "Enter a valid 10-digit mobile number";
    return "";
  };

  return (
    <div className="flex flex-col gap-6">
      <div id="clerk-captcha"></div>


      {/* Step 1: Email */}
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <FloatingLabelInput
              id="email"
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSendOtp}
            disabled={isLoading || !email}
            className="w-full rounded-full py-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Send OTP
          </Button>
        </div>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <div className="flex flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-neutral-800">
              Verify Your Identity
            </h1>
            <p className="text-neutral-500 max-w-[300px]">
              We've sent an email with your code to:{" "}
              <span className="font-medium">{email}</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-neutral-500">
            Didn't receive a code?{" "}
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={isLoading}
              className="text-primary-600 font-semibold hover:underline"
            >
              Resend
            </button>
          </div>

          <div className="w-full space-y-4">
            <Input
              id="otp"
              placeholder="Enter 6 digit code"
              type="text"
              maxLength={6}
              className="rounded-full py-6 text-center text-lg tracking-[0.5em] placeholder:tracking-normal placeholder:text-neutral-400"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />

            <Button
              onClick={handleVerifyOtp}
              disabled={isLoading || otp.length !== 6}
              className="w-full rounded-full py-6 bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Verify OTP
            </Button>

            <button
              type="button"
              onClick={() => updateStep(1)}
              className="text-neutral-500 hover:text-neutral-700 text-sm font-medium mt-4 block mx-auto"
            >
              Go Back
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Personal Details - Final Step */}
      {step === 3 && (
        <form
          onSubmit={handleDetailsSubmit}
          className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <FloatingLabelInput
                id="firstName"
                label="First Name"
                value={userDetails.firstName}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, firstName: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <FloatingLabelInput
                id="lastName"
                label="Last Name"
                value={userDetails.lastName}
                onChange={(e) =>
                  setUserDetails({ ...userDetails, lastName: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <FloatingLabelInput
              id="phone"
              type="tel"
              inputMode="numeric"
              pattern="[1-9][0-9]{9}"
              label="Phone Number"
              value={userDetails.phone}
              onChange={handlePhoneChange}
            />

            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <FloatingLabelInput
              id="pass"
              type="password"
              label="Password"
              value={userDetails.password}
              onChange={(e) =>
                setUserDetails({ ...userDetails, password: e.target.value })
              }
              required
            />
          </div>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-full py-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Complete Registration
          </Button>
        </form>
      )}
    </div>
  );
}
