import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  meetWebApplicationJsonLd,
  organizationJsonLd,
  rootMetadata,
} from "@/lib/metadata";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head />
        <body className="antialiased">
          <JsonLd data={[organizationJsonLd, meetWebApplicationJsonLd]} />
          {children}
          <Toaster theme="dark" position="top-center" />
        </body>
      </html>
    </ClerkProvider>
  );
}
