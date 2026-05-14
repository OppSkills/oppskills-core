import { Button } from "../ui/button";
import { useClerk, useSignIn, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Register from "./_components/Register";
import Login from "./_components/Login";
import ForgotPassword from "./_components/ForgotPassword";
import { X } from "lucide-react";
import { useQueryState } from "nuqs";
import Image from "next/image";
import { toast } from "sonner";
import { getClerkErrorMessage } from "@/lib/utils";

export default function Auth({ onClose }: { onClose: () => void }) {
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  const [authMode, setAuthMode] = useQueryState("auth");
  const { isLoaded, signIn } = useSignIn();
  const [registerStep, setRegisterStep] = useState(1);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkIsDesktop();
    window.addEventListener("resize", checkIsDesktop);
    return () => window.removeEventListener("resize", checkIsDesktop);
  }, []);

  const currentMode =
    authMode === "signup"
      ? "signup"
      : authMode === "forgot-password"
      ? "forgot-password"
      : "login";
  const isSignUpOtpStep = currentMode === "signup" && registerStep === 2;


  const handleGoogleLogin = async () => {
    if (!isLoaded) return;
    try {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("auth");

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: currentUrl.toString(),
      });
    } catch (err: unknown) {
      console.error("OAuth error", err);
      toast.error(getClerkErrorMessage(err, "Failed to start Google login"));
    }
  };

  return (
    <div className="fixed top-0 w-full bg-foreground/80 left-0 h-screen flex justify-center items-center z-50 px-4">
      <div
        className="relative w-full max-w-[850px] min-h-[500px] max-h-[90vh] md:h-[580px] bg-background rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-200 p-3"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="absolute top-4 right-4 z-50 cursor-pointer p-2 rounded-full bg-background/50 hover:bg-muted transition-colors border border-border/50 backdrop-blur-md"
          onClick={onClose}
        >
          <X className="w-5 h-5 text-foreground" />
        </div>

        {/* Hero Section - Persistent on Desktop */}
        {isDesktop && (
          <div className="hidden md:block w-full md:w-[45%] h-full relative overflow-hidden rounded-3xl">
            <img src={"/illustrations/login-sider.svg"} width={"100%"} />
          </div>
        )}

        {/* Form Section */}
        <div
          className={`w-full md:w-[55%] h-full bg-background flex flex-col`}
        >
          <div className="flex-1 overflow-y-auto p-8">
            <div
              className={`max-w-md mx-auto ${
                isSignUpOtpStep ? "mt-12" : ""
              }`}
            >
              {!isSignUpOtpStep && (
                <>
                  <div>
                    <h2 className="text-2xl text-neutral-800 font-semibold">
                      {currentMode === "login"
                        ? "Sign In"
                        : currentMode === "signup"
                        ? "Sign Up"
                        : "Reset Password"}
                    </h2>
                    <p className="text-neutral-700 py-2">
                      {currentMode === "login"
                        ? "Login to your account"
                        : currentMode === "signup"
                        ? "Register now to take part in all the events"
                        : "Enter your email to receive a reset code"}
                    </p>
                  </div>
                  {currentMode !== "forgot-password" && (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-center gap-2 py-1 mb-4 w-full">
                        <div className="border-[0.5px] border-neutral-400 p-1 rounded-full flex gap-2 w-full">
                          <Button
                            variant={
                              currentMode === "signup" ? "default" : "ghost"
                            }
                            className="rounded-full flex-1 font-normal"
                            onClick={() => {
                              setAuthMode("signup");
                              setRegisterStep(1);
                            }}
                          >
                            Sign Up
                          </Button>
                          <Button
                            variant={
                              currentMode === "login" ? "default" : "ghost"
                            }
                            className="rounded-full flex-1"
                            onClick={() => setAuthMode("login")}
                          >
                            Sign In
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-4">
                        <Button
                          onClick={handleGoogleLogin}
                          className="w-full rounded-full py-5 text-primary-600 border-px border-primary-200"
                          variant="outline"
                          type="button"
                          aria-label="Sign in with Google account"
                        >
                          <Image
                            src="/google.png"
                            alt="Google"
                            width={20}
                            height={20}
                          />{" "}
                          Continue with Google
                        </Button>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-neutral-200 " />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">
                              Or continue with
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </>
                )}

              <div className={`container ${!isSignUpOtpStep ? "mt-4" : ""}`}>
                {currentMode === "login" ? (
                  <Login setIsOpenLogin={onClose} />
                ) : currentMode === "signup" ? (
                  <Register
                    setIsOpenLogin={onClose}
                    onStepChange={setRegisterStep}
                  />
                ) : (
                  <ForgotPassword
                    onBack={() => setAuthMode("login")}
                    onSuccess={onClose}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
