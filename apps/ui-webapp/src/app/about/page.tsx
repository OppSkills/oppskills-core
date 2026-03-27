import Image from "next/image";
import PromoPoster from "@/components/landingpage/PromoPoster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import OppskillsFlow from "@/components/landingpage/OppskillsFlow";
import UpcomingFeatures from "@/components/landingpage/UpcomingFeatures";

export default function AboutPage() {
  return (
    <div className="py-12 lg:py-20 px-6 md:px-12 lg:px-16 xl:px-24 flex flex-col gap-16 md:gap-24">
      {/* Hero Section */}
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-start relative">
        <div className="flex flex-col gap-8 w-full lg:w-3/5">
          <div className="">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-neutral-900 tracking-tight poppins leading-tight">
              Building Skills.
            </h1>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-neutral-900 tracking-tight poppins leading-tight">
              Unlocking Opportunities.
            </h1>
          </div>

          <div className="flex flex-col gap-6 max-w-2xl">
            <p className="text-neutral-600 text-lg md:text-xl leading-relaxed inter font-normal">
              Oppskills is a skill-first opportunity platform designed to bridge the gap between learning and real-world exposure. We help students and early professionals discover, register for, and participate in meaningful opportunities that actually build careers—not just certificates.
            </p>
            <p className="text-neutral-600 text-lg md:text-xl leading-relaxed inter font-normal">
              From hackathons and workshops to internships, bootcamps, and community-driven events, Oppskills brings everything into one structured, accessible ecosystem.
            </p>
          </div>
        </div>

        {/* Hero Image */}
        <div className="w-full lg:w-2/5 lg:sticky top-20">
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-[2.5rem] shadow-xl border border-neutral-100">
            <Image
              src="/about-collaboration.png"
              alt="Team of students collaborating"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      {/* Mission & Vision Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
        <Card className="rounded-lg border-neutral-200 py-6 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-medium text-neutral-800 poppins">
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 text-lg leading-relaxed inter">
              To empower students and early professionals by connecting them with skill-driven, credible opportunities that enable real-world learning, practical experience, and career growth.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-lg border-neutral-200 py-6 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-medium text-neutral-800 poppins">
              Our Vision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 text-lg leading-relaxed inter">
              To build a future where skills define success, and every learner has equal access to opportunities that transform potential into impact.
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="">
        <OppskillsFlow />
        <UpcomingFeatures />
        <PromoPoster />
      </div>

    </div>
  );
}
