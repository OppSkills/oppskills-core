"use client";
import { CompetitionSidebar } from "./CompetitionSidebar";
import { CompetitionTabs } from "./CompetitionTabs";
import { RoundsTimeline } from "./RoundsTimeline";
import { AboutSection } from "./AboutSection";
import { Organizers } from "./Organizers";
import { Prizes } from "./Prizes";
import { CompetitionDetails } from "./types";
import { useEffect, useState } from "react";

interface CompetitionDetailsClientProps {
  competition: CompetitionDetails;
}

export default function CompetitionDetailsClient({
  competition,
}: CompetitionDetailsClientProps) {
  const [curTab, setCurTab] = useState<string | null>(null);

  useEffect(() => {
    if (curTab) {
      const element = document.getElementById(curTab);
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  }, [curTab]);

  return (
    <div className="min-h-screen bg-transparent py-8 px-0 sm:px-6 lg:px-8 pb-8 sm:pt-12 xl:px-25">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative items-start">
          {/* Sidebar */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto pr-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <CompetitionSidebar competition={competition} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-extrabold text-foreground leading-tight mb-6">
              {competition.title}
            </h1>

            <CompetitionTabs setCurTab={setCurTab} />

            <div className="space-y-12">
              <section id="details" className="scroll-mt-24">
                <AboutSection content={competition.about} />
              </section>

              <section id="rounds" className="scroll-mt-24">
                <RoundsTimeline rounds={competition.rounds} />
              </section>

              <section className="scroll-mt-24">
                <Organizers
                  organizers={competition.organizers}
                  contact={competition.contact}
                />
              </section>

              <section id="prizes" className="scroll-mt-24">
                <Prizes prizes={competition.prizes} />
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
