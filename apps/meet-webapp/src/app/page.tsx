import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { meetPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = meetPageMetadata({
  title: "Community video meetings",
  description:
    "OppSkills Meet — video calls for college events, hackathons, and student communities.",
  path: "/",
});

export default function HomePage() {
  redirect("https://oppskills.com/dashboard");
}
