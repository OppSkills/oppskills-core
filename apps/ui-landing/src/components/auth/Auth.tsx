import { Button } from "../ui/button";
import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import Register from "./_components/Register";
import Login from "./_components/Login";
import { X } from "lucide-react";
import { useQueryState } from "nuqs";

export default function Auth({ onClose }: { onClose: () => void }) {
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();
  const [authMode, setAuthMode] = useQueryState("auth");

  useEffect(() => {
    if (isSignedIn) {
      signOut();
    }
  }, [isSignedIn, signOut]);

  const currentMode = authMode === "signup" ? "signup" : "login";

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

        {/* Hero Section - Hidden on Mobile */}
        <div className="hidden md:block w-full md:w-[45%] h-full relative overflow-hidden rounded-3xl">
          <img src={"/illustrations/login-sider.svg"} width={"100%"} />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-[55%] h-full bg-background flex flex-col">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-md mx-auto">
              <div>
                <h2 className="text-2xl text-neutral-800 font-semibold">
                  {currentMode === "login" ? "Sign In" : "Sign Up"}
                </h2>
                <p className="text-neutral-700 py-2">
                  {currentMode === "login"
                    ? "Login to your account"
                    : "Register now to take part in all the events"}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 py-1 mb-4 w-full">
                <div className="border-[0.5px] border-neutral-400 p-1 rounded-full flex gap-2 w-full">
                  <Button
                    variant={currentMode === "signup" ? "default" : "ghost"}
                    className="rounded-full flex-1 font-normal"
                    onClick={() => setAuthMode("signup")}
                  >
                    Sign Up
                  </Button>
                  <Button
                    variant={currentMode === "login" ? "default" : "ghost"}
                    className="rounded-full flex-1"
                    onClick={() => setAuthMode("login")}
                  >
                    Sign In
                  </Button>
                </div>
              </div>
              <div className="container">
                {currentMode === "login" ? (
                  <Login setIsOpenLogin={onClose} />
                ) : (
                  <Register setIsOpenLogin={onClose} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
