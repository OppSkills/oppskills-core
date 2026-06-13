import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicCommunityByHandle } from "@/lib/api/communityApi";
import { getCommunityPost } from "@/lib/api/communityPostApi";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/constants";
import PostDetailView from "../../_components/PostDetailView";

type Props = {
  params: Promise<{ slug: string; postId: string }>;
};

async function getCommunity(handle: string) {
  try {
    return await getPublicCommunityByHandle(handle);
  } catch (error) {
    console.error("Error fetching community profile on SSR:", error);
    return null;
  }
}

async function getPost(handle: string, postId: string) {
  try {
    return await getCommunityPost(handle, postId);
  } catch (error) {
    console.error("Error fetching community post on SSR:", error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, postId } = await params;
  if (!slug || !postId) return {};

  const [profile, post] = await Promise.all([
    getCommunity(slug),
    getPost(slug, postId),
  ]);

  if (!profile || !post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found.",
    };
  }

  const authorName =
    `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() ||
    "Member";
  const title = `Post by ${authorName} @${profile.handle.toLowerCase()}`;

  const plainTextContent = post.content
    ? post.content.replace(/<[^>]+>/g, "")
    : "";
  const description = plainTextContent
    ? plainTextContent.slice(0, 160)
    : `View post by ${authorName} in the ${profile.name} community on OppSkills.`;

  let ogImageUrl = `${SITE_URL}/og_poster.png`;
  if (post.images && post.images.length > 0) {
    ogImageUrl = post.images[0];
  } else if (profile.avatarImage) {
    ogImageUrl = profile.avatarImage;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/community/${profile.handle}/posts/${post.id}`,
      siteName: "OppSkills",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${profile.name} community post`,
        },
      ],
      type: "article",
      publishedTime: post.createdAt,
      authors: [authorName],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${SITE_URL}/community/${profile.handle}/posts/${post.id}`,
    },
  };
}

export default async function CommunityPostPage({ params }: Props) {
  const { slug, postId } = await params;
  if (!slug || !postId) {
    notFound();
  }

  const [profile, post] = await Promise.all([
    getCommunity(slug),
    getPost(slug, postId),
  ]);

  if (!profile || !post) {
    notFound();
  }

  const authorName =
    `${post.author.firstName || ""} ${post.author.lastName || ""}`.trim() ||
    "Member";

  const postSchema = {
    "@context": "https://schema.org",
    "@type": "SocialMediaPosting",
    headline: `Post by ${authorName} in ${profile.name}`,
    articleBody: post.content || "",
    datePublished: post.createdAt,
    dateModified: post.createdAt,
    image:
      post.images && post.images.length > 0
        ? post.images
        : [profile.avatarImage || `${SITE_URL}/logo.svg`],
    url: `${SITE_URL}/community/${profile.handle}/posts/${post.id}`,
    author: {
      "@type": "Person",
      name: authorName,
      image: post.author.imageUrl || undefined,
    },
    publisher: {
      "@type": "Organization",
      name: profile.name,
      logo: profile.avatarImage || `${SITE_URL}/logo.svg`,
      url: `${SITE_URL}/community/${profile.handle}`,
    },
  };

  return (
    <>
      <JsonLd data={postSchema} />
      <div className="w-full px-4 py-8 animate-in fade-in duration-500">
        <PostDetailView
          handle={slug}
          postId={postId}
          communityId={profile.id}
          initialPost={post}
        />
      </div>
    </>
  );
}
