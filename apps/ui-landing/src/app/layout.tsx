import type { Metadata } from "next";
import { Inter, Poppins, Kaushan_Script } from "next/font/google";
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

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const kaushan = Kaushan_Script({
  variable: "--font-kaushan",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://oppskills.com"),
  title: {
    default:
      "OppSkills | College Events, Hackathons, Competitions & Student Opportunities",
    template: "%s | OppSkills",
  },
  description:
    "OppSkills is the best event organiser platform for students. Discover and host hackathons, college events, competitions, internships, and student opportunities. A better alternative to Unstop for college hackathons.",
  keywords: [
    "OppSkills",
    "college events",
    "hackathons",
    "student opportunities",
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
      name: "Vijay Singh",
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
      default: "OppSkills | College Events, Hackathons & Student Opportunities",
      template: "%s | OppSkills",
    },
    description:
      "Discover and host college events, hackathons, competitions, and student opportunities on OppSkills.",
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
      default: "OppSkills | College Events, Hackathons & Student Opportunities",
      template: "%s | OppSkills",
    },
    description:
      "Discover and host hackathons, college events, and student opportunities.",
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
          className={`${inter.variable} ${poppins.variable} ${kaushan.variable} font-sans antialiased`}
        >
          <JsonLd data={[organizationSchema, websiteSchema]} />
          <Suspense>
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
          </Suspense>
        </body>
      </html>
    </ClerkProvider>
  );
}
