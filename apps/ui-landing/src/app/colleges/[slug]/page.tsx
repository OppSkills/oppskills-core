import type { Metadata } from "next";
import { getCollegeBySlug } from "@/lib/data/mockColleges";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const college = await getCollegeBySlug(slug);

  if (!college) {
    return {
      title: "College Not Found | OppSkills",
    };
  }

  return {
    title: `${college.name} - Events & Hackathons | OppSkills`,
    description: `Discover upcoming events, hackathons, and student activities at ${college.name}, ${college.location}.`,
    openGraph: {
      title: `${college.name} - Events & Hackathons`,
      description: college.description,
    },
  };
}

export default async function CollegePage({ params }: Props) {
  const { slug } = await params;
  const college = await getCollegeBySlug(slug);

  if (!college) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold">College Not Found</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">{college.name}</h1>
      <p className="text-xl text-muted-foreground mb-8">{college.location}</p>

      <section className="prose dark:prose-invert max-w-none">
        <p>{college.description}</p>
      </section>

      {/* In a real app, list events for this college here */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">
          Upcoming Events at {college.name}
        </h2>
        <p className="text-muted-foreground italic">
          No upcoming events listed at the moment.
        </p>
      </div>
    </div>
  );
}
