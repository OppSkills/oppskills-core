import { SITE_URL } from "@/lib/constants";
import { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title:
    "Better Alternative to Unstop for Hackathons & College Events | OppSkills",
  description:
    "Looking for an Unstop alternative? OppSkills offers a better platform for hosting and participating in college hackathons, events, and competitions with lower fees and better support.",
  keywords: [
    "Unstop alternative",
    "Unstop competitor",
    "hackathon platform",
    "college event platform",
    "Opportunities for students",
    "better than unstop",
    "OppSkills vs Unstop",
  ],
  alternates: {
    canonical: `${SITE_URL}/unstop-alternative`,
  },
  openGraph: {
    title: "Better Alternative to Unstop | OppSkills",
    description:
      "Compare OppSkills vs Unstop. Why OppSkills is the best platform for students and organizers for hackathons and events.",
    url: `${SITE_URL}/unstop-alternative`,
    type: "article",
    images: [
      {
        url: "/og_poster.png",
        width: 1200,
        height: 630,
        alt: "OppSkills vs Unstop",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Better Alternative to Unstop | OppSkills",
    description:
      "Compare OppSkills vs Unstop. The best platform for college hackathons and events.",
    images: ["/og_poster.png"],
  },
};

export default function UnstopAlternativePage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Why OppSkills is the Best Unstop Alternative",
          description:
            "Compare OppSkills vs Unstop. Why OppSkills is the best platform for students and organizers for hackathons and events.",
          author: {
            "@type": "Organization",
            name: "OppSkills",
          },
          publisher: {
            "@type": "Organization",
            name: "OppSkills",
            logo: {
              "@type": "ImageObject",
              url: `${SITE_URL}/logo.svg`,
            },
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `${SITE_URL}/unstop-alternative`,
          },
        }}
      />

      <h1 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">
        Why OppSkills is the Best{" "}
        <span className="text-primary">Unstop Alternative</span>
      </h1>

      <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
        Are you an organizer looking for a seamless way to host hackathons? Or a
        student tired of cluttered platforms? OppSkills is designed to put user
        experience first, making it the premier alternative for college events
        and competitions.
      </p>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="p-6 border rounded-2xl bg-card shadow-sm">
          <h3 className="text-2xl font-bold mb-3">For Organizers</h3>
          <ul className="space-y-3 list-disc list-inside text-muted-foreground">
            <li>Zero setup fees for free events</li>
            <li>Instant payouts (no holding period)</li>
            <li>Customizable registration forms</li>
            <li>Dedicated support manager</li>
          </ul>
        </div>
        <div className="p-6 border rounded-2xl bg-card shadow-sm">
          <h3 className="text-2xl font-bold mb-3">For Students</h3>
          <ul className="space-y-3 list-disc list-inside text-muted-foreground">
            <li>Clean, ad-free interface</li>
            <li>Direct connection with organizers</li>
            <li>Verified certificates</li>
            <li>Skill-based opportunities</li>
          </ul>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to switch?</h2>
        <div className="flex gap-4 justify-center">
          <Link
            href="/organize"
            className="px-6 py-3 bg-primary-500 text-primary-foreground rounded-full font-semibold hover:bg-primary/90 transition"
          >
            Host an Event
          </Link>
          <Link
            href="/hackathons"
            className="px-6 py-3 border border-input bg-background hover:bg-accent text-accent-foreground rounded-full font-semibold transition"
          >
            Explore Hackathons
          </Link>
        </div>
      </div>
    </div>
  );
}
