import type { Metadata } from "next";
import CompetitionDetailsClient from "./_components/CompetitionDetailsClient";
import { getCompetitionBySlug } from "@/lib/data/mockCompetitions";
import { Loader2 } from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Wait for the slug params
  const { slug } = await params;
  const competition = (await getCompetitionBySlug(slug)) as any;

  if (!competition) {
    return {
      title: "Competition Not Found | OppSkills",
      description: "The requested competition could not be found.",
    };
  }

  const title = `${competition.title} | College Hackathon`;
  const description =
    competition.shortDescription ||
    "Join this exciting competition on OppSkills.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: competition.thumbnail ? [competition.thumbnail] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: competition.thumbnail ? [competition.thumbnail] : undefined,
    },
  };
}

export default async function CompetitionPage({ params }: Props) {
  // Wait for the slug params
  const { slug } = await params;
  const competition = (await getCompetitionBySlug(slug)) as any;

  if (!competition) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Competition Not Found
        </h1>
        <p className="text-muted-foreground">
          The competition you&apos;re looking for doesn&apos;t exist or has been
          removed.
        </p>
      </div>
    );
  }

  return <CompetitionDetailsClient competition={competition} />;
}
