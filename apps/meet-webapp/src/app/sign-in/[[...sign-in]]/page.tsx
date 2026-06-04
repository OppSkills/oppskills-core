import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { meetPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = meetPageMetadata({
  title: "Sign in",
  description: "Sign in to join your OppSkills Meet video call.",
  path: "/sign-in",
  noIndex: true,
});

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <SignIn routing="hash" />
    </div>
  );
}
