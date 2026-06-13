import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCommunityByHandle } from "@/lib/api/communityApi";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/constants";
import CommunityDashboard from "./_components/CommunityDashboard";
import CommunityNotFound from "./_components/CommunityNotFound";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getCommunity(handle: string): Promise<any> {
  try {
    return await getPublicCommunityByHandle(handle);
  } catch (error) {
    console.error("Error fetching community profile on SSR:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!slug) return {};

  const profile = await getCommunity(slug);
  if (!profile) {
    return {
      title: `@${slug.toLowerCase()} is up for grabs! | OppSkills`,
      description: `Create a new community on OppSkills to claim the @${slug} handle.`,
    };
  }

  const title = `${profile.name.charAt(0).toUpperCase() + profile.name.slice(1)} @${profile.handle.toLowerCase()}`;
  const description = profile.description
    ? profile.description.slice(0, 160)
    : `Join the ${profile.name} community on OppSkills. Connect with members, view upcoming events, and participate in discussions.`;

  const bannerImageUrl =
    profile.avatarImage || profile.coverImage || `${SITE_URL}/og_poster.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/community/${profile.handle}`,
      siteName: "OppSkills",
      images: [
        {
          url: bannerImageUrl,
          width: 1200,
          height: 630,
          alt: profile.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [bannerImageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/community/${profile.handle}`,
    },
  };
}

export default async function CommunityProfilePage({ params }: Props) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }

  const profile = await getCommunity(slug);
  if (!profile) {
    return <CommunityNotFound handle={slug} />;
  }

  const communitySchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: profile.name,
    description: profile.description || "",
    url: `${SITE_URL}/community/${profile.handle}`,
    logo: profile.avatarImage || `${SITE_URL}/logo.svg`,
    image: profile.coverImage || profile.avatarImage || `${SITE_URL}/logo.svg`,
    member: {
      "@type": "OrganizationRole",
      memberCount: profile.memberCount,
    },
  };

  return (
    <>
      <JsonLd data={communitySchema} />
      <div className="w-full min-h-screen bg-[#FDFBF7]/40 flex flex-col justify-start items-center">
        <CommunityDashboard handle={slug} initialProfile={profile} />
      </div>
    </>
  );
}
