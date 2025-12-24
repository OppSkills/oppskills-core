import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "College Hackathons, Coding Competitions & Events | OppSkills",
  description:
    "Explore the latest college hackathons, coding competitions, design challenges, and student events. Join the best tech community and showcase your skills.",
  keywords: [
    "hackathons",
    "college competitions",
    "coding challenges",
    "student events",
    "tech hackathons",
    "design contests",
    "programming competitions",
    "unstop alternative",
  ],
  alternates: {
    canonical: "https://oppskills.com/competitions",
  },
  openGraph: {
    title: "College Hackathons & Competitions | OppSkills",
    description:
      "Find and participate in the best college hackathons and competitions. Level up your skills and win prizes.",
    url: "https://oppskills.com/competitions",
    images: [
      {
        url: "/og_poster.png", // Ensure this exists or use a specific one for competitions if available
        width: 1200,
        height: 630,
        alt: "OppSkills Competitions",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "College Hackathons & Competitions | OppSkills",
    description:
      "Find and participate in the best college hackathons and competitions. Level up your skills and win prizes.",
    images: ["/og_poster.png"],
  },
};

export default function CompetitionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
