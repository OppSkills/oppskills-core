import { SITE_URL } from "@/lib/constants";
import React from "react";

type JsonLdProps = {
  data: Record<string, any> | Record<string, any>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "OppSkills",
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  sameAs: [
    "https://www.instagram.com/oppskills.global/",
    "https://linkedin.com/company/oppskills",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "OppSkills",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/competitions?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};
