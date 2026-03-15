"use client";

import React from "react";
import Image from "next/image";

const ParticipateSection = () => {
  return (
    <section className="w-full flex justify-center bg-background">
      <div className="w-full max-w-[1440px] px-6 py-12 md:px-[60px] xl:px-[140px] md:py-[48px] flex flex-col items-start gap-10">
        <div className="flex flex-col items-start gap-6 w-full">
          <h1 className="poppins font-semibold text-[32px] md:text-[48px] leading-[125%] text-foreground">
            Participate in
          </h1>
          <p className="inter font-normal text-base md:text-[20px] leading-normal text-muted-foreground w-full max-w-[811px]">
            Build skills, network with professionals, and accelerate your career
            journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full place-items-center lg:place-items-start">
          <div className="relative w-full max-w-[370px] h-[182px] rounded-[24px] overflow-hidden bg-[#C4CAFF] flex p-6 transition-transform hover:scale-105 shadow-sm group">
            <div className="relative z-10 flex flex-col gap-2">
              <h3 className="poppins font-semibold text-[24px] leading-[125%] text-[#002B26]">
                Competitions
              </h3>
              <ul className="inter font-normal text-base leading-[150%] text-[#342636] space-y-0.5">
                <li>Idea Comp</li>
                <li>Hackathons</li>
                <li>Quizzes</li>
              </ul>
            </div>
            <div className="absolute bottom-[-10px] right-[-10px]">
              <Image
                src="/character-competitions.png"
                alt="Competitions character"
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

          {/* --- CARD 2: EVENTS --- */}
          <div className="relative w-full max-w-[370px] h-[182px] rounded-[24px] overflow-hidden bg-[#FFEFA7] flex p-6 transition-transform hover:scale-105 shadow-sm group">
            <div className="relative z-10 flex flex-col gap-2">
              <h3 className="poppins font-semibold text-[24px] leading-[125%] text-[#2B2600]">
                Events
              </h3>
              <ul className="inter font-normal text-base leading-[150%] text-[#363426] space-y-0.5">
                <li>Workshops</li>
                <li>Tech events</li>
                <li>Innovation meets</li>
              </ul>
            </div>
            <div className="absolute bottom-[-10px] right-[-10px]">
              <Image
                src="/character-events.png"
                alt="Events character"
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

          {/* --- CARD 3: COMMUNITIES --- */}
          <div className="relative w-full max-w-[370px] h-[182px] rounded-[24px] overflow-hidden bg-[#FDC5F5] flex p-6 transition-transform hover:scale-105 shadow-sm group">
            <div className="relative z-10 flex flex-col gap-2">
              <h3 className="poppins font-semibold text-[24px] leading-[125%] text-[#2B001F]">
                Communities
              </h3>
              <ul className="inter font-normal text-base leading-[150%] text-[#362632] space-y-0.5">
                <li>Tech</li>
                <li>Design</li>
                <li>Fitness</li>
              </ul>
            </div>
            <div className="absolute bottom-[-10px] right-[-10px]">
              <Image
                src="/character-communities.png"
                alt="Communities character"
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
        </div>
      </div>
    </section>
  );
};

export default ParticipateSection;
