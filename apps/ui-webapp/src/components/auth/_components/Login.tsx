"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { FloatingLabelInput } from "@/components/ui/derived/FloatingInput";
import { getClerkErrorMessage } from "@/lib/utils";

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
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        toast.success("Welcome back!");
        setIsOpenLogin(false);
        router.refresh();
      } else {
        console.log(result);
        toast.error("Something went wrong during sign in");
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
    </div>
  );
}
