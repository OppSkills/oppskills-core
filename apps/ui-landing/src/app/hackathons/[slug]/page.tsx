import type { Metadata } from "next";
import { getHackathonBySlug } from "@/lib/api/hackathonApi";
import { JsonLd } from "@/components/seo/JsonLd";

type Props = {
  params: Promise<{ slug: string }>;
};

async function getHackathon(slug: string) {
  try {
    return await getHackathonBySlug("", slug); // Pass empty string as token for public
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const hackathon = (await getHackathon(slug)) as any;

  if (!hackathon) {
    return {
      title: "Hackathon Not Found | OppSkills",
    };
  }

  const title = `${hackathon.name} | College Hackathon`;
  const description =
    hackathon.tagline ||
    `Join ${hackathon.name} - the ultimate college hackathon.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: hackathon.bannerUrl ? [hackathon.bannerUrl] : undefined,
    },
  };
}

export default async function HackathonPage({ params }: Props) {
  const { slug } = await params;
  const hackathon = (await getHackathon(slug)) as any;

  if (!hackathon) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold">Hackathon Not Found</h1>
      </div>
    );
  }

  const hackathonSchema = {
    "@context": "https://schema.org",
    "@type": "Hackathon",
    name: hackathon.name,
    description: hackathon.tagline || hackathon.description,
    startDate: hackathon.startDate,
    endDate: hackathon.endDate,
    location: {
      "@type": "Place",
      name: "Online", // default for hackathon if no location logic
    },
    image: hackathon.bannerUrl ? [hackathon.bannerUrl] : undefined,
    organizer: {
      "@type": "Organization",
      name: "OppSkills",
      url: "https://oppskills.com",
    },
  };

  return (
    <>
      <JsonLd data={hackathonSchema} />
      <div className="container mx-auto px-4 py-12">
        {/* Basic SEO-friendly content structure */}
        <h1 className="text-4xl font-bold mb-4">{hackathon.name}</h1>
        <p className="text-xl text-muted-foreground mb-8">
          {hackathon.startDate
            ? new Date(hackathon.startDate).toLocaleDateString()
            : "Date TBA"}
        </p>

        <section className="prose dark:prose-invert max-w-none">
          <div
            dangerouslySetInnerHTML={{ __html: hackathon.description || "" }}
          />
        </section>

        <div className="mt-8">
          {/* Call to action or Client Component button could go here */}
          <button className="px-6 py-2 bg-primary-500 text-primary-foreground rounded-lg font-medium">
            Register Now
          </button>
        </div>
      </div>
    </>
  );
}
