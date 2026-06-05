import type { Metadata } from "next";
import { MAIN_SITE_URL, MEET_SITE_URL } from "./constants";

export const OG_IMAGE = {
  url: "/og_poster.png",
  width: 1200,
  height: 630,
  alt: "OppSkills – College Events, Hackathons & Opportunities",
} as const;

const defaultTitle = "OppSkills Meet | Community video meetings for students";
const defaultDescription =
  "Join live community meetings on OppSkills. Video calls for college events, hackathons, clubs, and student communities.";

export const rootMetadata: Metadata = {
  metadataBase: new URL(MEET_SITE_URL),
  title: {
    default: defaultTitle,
    template: "%s | OppSkills Meet",
  },
  description: defaultDescription,
  keywords: [
    "OppSkills Meet",
    "OppSkills",
    "video meeting",
    "community meet",
    "college events",
    "student video call",
    "hackathon meet",
    "online meeting",
  ],
  authors: [{ name: "OppSkills Team" }],
  publisher: "OppSkills",
  applicationName: "OppSkills Meet",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: {
      default: defaultTitle,
      template: "%s | OppSkills Meet",
    },
    description: defaultDescription,
    url: MEET_SITE_URL,
    siteName: "OppSkills Meet",
    locale: "en_US",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: defaultTitle,
      template: "%s | OppSkills Meet",
    },
    description: defaultDescription,
    images: [OG_IMAGE.url],
    creator: "@oppskills",
  },
  alternates: {
    canonical: "./",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      {
        rel: "manifest",
        url: "/site.webmanifest",
      },
    ],
  },
  other: {
    "instagram:site": "https://www.instagram.com/oppskills.global/",
    "linkedin:site": "https://linkedin.com/company/oppskills",
  },
};

export function meetPageMetadata({
  title,
  description,
  path = "",
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}): Metadata {
  const pageDescription = description ?? defaultDescription;
  const canonicalPath = path.startsWith("/") ? path : `/${path}`;
  const pageUrl = `${MEET_SITE_URL}${canonicalPath === "/" ? "" : canonicalPath}`;

  return {
    title,
    description: pageDescription,
    robots: noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description: pageDescription,
      url: pageUrl,
      siteName: "OppSkills Meet",
      type: "website",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: pageDescription,
      images: [OG_IMAGE.url],
    },
    alternates: {
      canonical: canonicalPath,
    },
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OppSkills",
  url: MAIN_SITE_URL,
  logo: `${MAIN_SITE_URL}/logo.svg`,
  sameAs: [
    "https://www.instagram.com/oppskills.global/",
    "https://linkedin.com/company/oppskills",
  ],
};

export const meetWebApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OppSkills Meet",
  url: MEET_SITE_URL,
  applicationCategory: "CommunicationApplication",
  operatingSystem: "Web",
  description: defaultDescription,
  publisher: {
    "@type": "Organization",
    name: "OppSkills",
    url: MAIN_SITE_URL,
  },
};
