import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import localFont from "next/font/local"

import "./globals.css";
import {
  JsonLd,
  organizationSchema,
  websiteSchema,
} from "@/components/seo/JsonLd";
import { ThemeProvider } from "@/components/theme-provider";
import ClientProviders from "../../src/client-providers";

import { ClerkProvider } from "@clerk/nextjs";
import LayoutProvider from "@/components/layout-provider";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Suspense } from "react";
import { PostHogProvider } from "@/components/posthog-provider";


const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const aeonicPro = localFont({
  src: [
    {
      path: "../../public/fonts/AeonicPro-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/AeonicPro-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/AeonicPro-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aeonicPro",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oppskills.com"),
  title: {
    default:
      "OppSkills | College Events, Hackathons, Competitions & Opportunities for students",
    template: "%s | OppSkills",
  },
  description:
    "OppSkills is the best event organiser platform for students. Discover and host hackathons, college events, competitions, internships, and Opportunities for students. A better alternative to Unstop for college hackathons.",
  keywords: [
    "OppSkills",
    "college events",
    "hackathons",
    "Opportunities for students",
    "college competitions",
    "college hackathons India",
    "student event platform",
    "coding competitions",
    "tech events",
    "student communities",
    "club events",
    "Unstop alternative",
    "Unstop competitor",
    "unstop hackathon",
    "college hackathon",
    "event organiser",
    "hackathon platform",
    "promote event",
  ],
  authors: [
    {
      name: "OppSkills Team",
    },
  ],
  publisher: "OppSkills",
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
      default:
        "OppSkills | College Events, Hackathons & Opportunities for students",
      template: "%s | OppSkills",
    },
    description:
      "Discover and host college events, hackathons, competitions, and Opportunities for students on OppSkills.",
    url: "https://oppskills.com",
    siteName: "OppSkills",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og_poster.png",
        width: 1200,
        height: 630,
        alt: "OppSkills – College Events, Hackathons & Opportunities",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default:
        "OppSkills | College Events, Hackathons & Opportunities for students",
      template: "%s | OppSkills",
    },
    description:
      "Discover and host hackathons, college events, and Opportunities for students.",
    images: ["/og_poster.png"],
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head></head>
        <body
          className={`${urbanist.variable} ${aeonicPro.variable} font-sans antialiased`}
        >
          <JsonLd data={[organizationSchema, websiteSchema]} />
          <Suspense>
            <PostHogProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="light"
                enableSystem
                disableTransitionOnChange
              >
                <ClientProviders>
                  <NuqsAdapter>
                    <LayoutProvider>{children}</LayoutProvider>
                  </NuqsAdapter>
                </ClientProviders>
              </ThemeProvider>
            </PostHogProvider>
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
