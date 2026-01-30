"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function HeroSection() {
  const router = useRouter();

  const HERO_CARDS = [
    {
      title: "Competitions",
      items: ["Idea Comp", "Hackathons", "Quizzes"],
      image: "/character-competitions.png",
      link: "/competitions",
      styles: {
        bg: "bg-[#C4CAFF]",
        circle: "bg-[#8390FF]",
      },
      alt: "Competitions character",
    },
    {
      title: "Events",
      items: ["Workshops", "Tech events", "Innovation meets"],
      image: "/character-events.png",
      link: "/events",
      styles: {
        bg: "bg-[#FFEFA7]",
        circle: "bg-[#F7CF04]",
      },
      alt: "Events character",
    },
    {
      title: "Communities",
      items: ["Tech", "Design", "Fitness"],
      image: "/character-communities.png",
      link: "#comingsoon",
      styles: {
        bg: "bg-[#FDC5F5]",
        circle: "bg-[#F675D1]",
      },
      alt: "Communities character",
    },
  ];

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-between bg-background overflow-hidden">
      <div className="relative z-40 max-w-[1159px] text-center space-y-6 py-16">
        <div className="space-y-2">
          <h1 className="poppins font-semibold text-foreground text-[40px] sm:text-[60px] md:text-[80px] leading-tight tracking-tight">
            Global Opportunities Powered by{" "}
            <span className="text-primary-500 kaushan-script font-normal">
              Skills
            </span>
          </h1>
        </div>

        <p className="w-full max-w-[993px] mx-auto text-center text-muted-foreground text-[18px] md:text-[28px] font-normal leading-normal px-2 inter">
          Connect with events, hackathons, and communities worldwide. Build
          skills, network with professionals, and accelerate your career
          journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 w-full max-w-lg mx-auto">
          <Button
            onClick={() => router.push("/competitions")}
            className="
      inline-flex items-center justify-center gap-3
      px-6 py-3
      rounded-[37px]
      bg-primary-500 text-primary-foreground hover:opacity-90
      inter font-semibold text-[20px] leading-[150%]
      shadow-md transition-all hover:-translate-y-1 h-auto
    "
          >
            Find Opportunities
          </Button>

          {/* BUTTON 2: Join Communities (Ghost) */}
          <Button
            variant="ghost"
            className="
      inline-flex items-center justify-center gap-3
      px-6 py-3
      rounded-[37px]
      text-primary-500 hover:bg-muted
      inter font-semibold text-[20px] leading-[150%]
      transition-all hover:-translate-y-1 h-auto
    "
          >
            Join Communities
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full justify-center gap-4 py-8 md:py-12 lg:py-15">
        {HERO_CARDS.map((card, index) => (
          <div
            key={index}
            onClick={() => {
              router.push(card.link);
            }}
            className={`relative w-full h-[182px] rounded-3xl overflow-hidden ${card.styles.bg} flex p-6 transition-transform hover:scale-105 shadow-inner group mx-auto max-w-md md:max-w-none`}
          >
            <div className="relative z-10 flex flex-col gap-2">
              <p
                className={`poppins font-semibold text-[24px] leading-[125%] text-neutral-900`}
              >
                {card.title}
              </p>
              <ul
                className={`inter font-normal text-[16px] leading-[150%] text-neutral-800 space-y-0.5`}
              >
                {card.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="absolute bottom-[-10px] right-0">
              <div
                className={`w-[120px] h-[120px] rounded-full ${card.styles.circle} absolute -top-3 right-3`}
              ></div>
              <Image
                src={card.image}
                alt={card.alt}
                width={171}
                height={171}
                className="object-contain"
                style={{
                  width: "170.45px",
                  height: "170.45px",
                  filter:
                    "drop-shadow(0px 6.619px 6.619px rgba(0, 0, 0, 0.25))",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
