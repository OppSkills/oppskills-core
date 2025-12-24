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
  url: "https://oppskills.com",
  logo: "https://oppskills.com/logo.svg",
  sameAs: [
    "https://www.instagram.com/oppskills.global/",
    "https://linkedin.com/company/oppskills",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "OppSkills",
  url: "https://oppskills.com",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://oppskills.com/competitions?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};
