"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { getRegistrations } from "@/lib/api/usersApi";
import { HackathonCard } from "./_components/HackathonCard";
import { SwiperControls } from "./_components/SwiperControls";
import { Loader2, CheckCircle2, Clock, Trophy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Registration {
  id: string;
  title: string;
  type: string;
  opportunityType: "event" | "hackathon";
  registeredOn: string;
  registeredBy: string;
  teamName: string;
  deadline: string;
  bannerUrl: string;
  isComplete: boolean;
  stages: Array<{ label: string; status: string }>;
}

function OpportunityFooter({ reg }: { reg: Registration }) {
  const isHackathon = reg.opportunityType === "hackathon";

  return (
    <div className="flex items-center justify-between pt-2 w-full">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-neutral-500">
          {isHackathon ? "Team" : "Registered by"}
        </span>
        <span className="text-neutral-700 text-sm font-medium truncate max-w-[100px]">
          {isHackathon ? reg.teamName : reg.registeredBy}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-xs text-neutral-500">Registered on</span>
        <span className="text-neutral-700 text-sm font-medium">
          {reg.registeredOn}
        </span>
      </div>

      <div className="flex flex-col items-end gap-1">
        <span className="text-xs text-neutral-500">Status</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
            reg.isComplete
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-600"
          )}
        >
          {reg.isComplete ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {reg.isComplete ? "Complete" : "Pending"}
        </span>
      </div>
    </div>
  );
}

export default function MyOpportunities() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [prevEl, setPrevEl] = useState<HTMLButtonElement | null>(null);
  const [nextEl, setNextEl] = useState<HTMLButtonElement | null>(null);
  const [paginationEl, setPaginationEl] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getRegistrations(token);
        setRegistrations(data as Registration[]);
      } catch (err) {
        console.error("Failed to load registrations", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isLoaded, isSignedIn, getToken]);

  // Don't render anything until auth is resolved
  if (!isLoaded || !isSignedIn) return null;

  if (isLoading) {
    return (
      <section className="w-full pt-12 md:pt-16 lg:pt-20">
        <div className="container mx-auto">
          <div className="mb-8 space-y-2 flex flex-col gap-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
              My Opportunities
            </h2>
            <p className="text-muted-foreground text-lg inter">
              Events and competitions you have registered for.
            </p>
          </div>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (registrations.length === 0) return null;

  return (
    <section className="w-full pt-12 md:pt-16 lg:pt-20">
      <div className="container mx-auto">
        <div className="mb-8 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
                My Opportunities
              </h2>
              <p className="text-muted-foreground text-lg inter">
                Events and competitions you have registered for.
              </p>
            </div>
            <Link
              href="/profile/registrations"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors shrink-0"
            >
              View all →
            </Link>
          </div>
        </div>

        <div className="relative pb-10">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            breakpoints={{
              0: { slidesPerView: 1, slidesPerGroup: 1 },
              768: { slidesPerView: 2, slidesPerGroup: 1 },
              1024: { slidesPerView: 3, slidesPerGroup: 1 },
              1280: { slidesPerView: 4, slidesPerGroup: 3 },
            }}
            loop={registrations.length > 4}
            navigation={{ prevEl, nextEl }}
            pagination={{
              clickable: true,
              el: paginationEl,
              bulletClass:
                "inline-block w-2.5 h-2.5 bg-muted-foreground/30 rounded-full mx-1 cursor-pointer transition-all duration-300 hover:bg-primary/50",
              bulletActiveClass: "!bg-primary !w-6",
            }}
          >
            {registrations.map((reg) => {
              const isHackathon = reg.opportunityType === "hackathon";
              const href = isHackathon
                ? `/hackathons/${reg.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`
                : `/events/${reg.title
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`;

              const topRightBadge = (
                <div className="bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground shadow-sm flex items-center gap-1">
                  {isHackathon ? (
                    <Trophy className="w-2.5 h-2.5" />
                  ) : (
                    <Calendar className="w-2.5 h-2.5" />
                  )}
                  {reg.type}
                </div>
              );

              return (
                <SwiperSlide key={reg.id} className="h-auto!">
                  <HackathonCard
                    href="/profile/registrations"
                    imageSrc={reg.bannerUrl}
                    title={reg.title}
                    isFree={false}
                    mode={isHackathon ? "Competition" : "Event"}
                    topRightBadge={topRightBadge}
                    footerContent={<OpportunityFooter reg={reg} />}
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>

          <SwiperControls
            setPrevEl={setPrevEl}
            setNextEl={setNextEl}
            setPaginationEl={setPaginationEl}
          />
        </div>
      </div>
    </section>
  );
}
