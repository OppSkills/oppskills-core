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

export default function Register({
  setIsOpenLogin,
}: {
  setIsOpenLogin: (mode: boolean) => void;
}) {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  // UI State
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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
      setStep(2);
      toast.success("Verification code sent!");
    } catch (err: unknown) {
      console.log(JSON.stringify(err, null, 2));
      toast.error(getClerkErrorMessage(err, "Something went wrong"));
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
        setStep(3);
        toast.success("Email verified!");
      } else {
        setStep(3);
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
      setStep(s);
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
      {/* Steps Indicator - Clickable */}
      <div className="relative flex justify-between mb-4">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 -z-0" />

        {/* Animated Progress Bar */}
        <motion.div
          className="absolute top-1/2 left-0 h-0.5 bg-primary-500 -translate-y-1/2 -z-0"
          initial={{ width: "0%" }}
          animate={{
            width: `${((step - 1) / 2) * 100}%`,
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        />

        {[1, 2, 3].map((i) => (
          <RTooltip content={stepName[i].name} key={i}>
            <button
              onClick={() => handleStepClick(i)}
              disabled={i > step}
              className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full text-xs font-bold transition-colors border-none outline-none focus:ring-2 ring-offset-1 focus:ring-primary-500 ${
                step >= i
                  ? "bg-primary-500 text-primary-foreground cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {step > i ? <Check className="w-4 h-4" /> : stepName[i].icon}
            </button>
          </RTooltip>
        ))}
      </div>

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
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              We sent a code to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <button
              onClick={() => setStep(1)}
              className="text-xs text-primary-500 hover:underline mt-1"
            >
              Change email
            </button>
          </div>
          <div className="space-y-4">
            <FloatingLabelInput
              id="otp"
              label="Enter 6-digit Code"
              type="text"
              maxLength={6}
              className="text-center text-2xl tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </div>
          <Button
            onClick={handleVerifyOtp}
            disabled={isLoading || otp.length !== 6}
            className="w-full rounded-full py-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Verify Code
          </Button>
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
