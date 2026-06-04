import type { Metadata } from "next";
import { meetPageMetadata } from "@/lib/metadata";
import MeetLanding from "@/components/landing/MeetLanding";

export const metadata: Metadata = meetPageMetadata({
  title: "Community video meetings",
  description:
    "OppSkills Meet — join or start video calls for college events, hackathons, and student communities.",
  path: "/",
});

export default function HomePage() {
  return <MeetLanding />;
}
