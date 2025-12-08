"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function HeroSection() {
  const router = useRouter();
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-between pt-16 md:pt-30 bg-background overflow-hidden">
      <div className="relative z-40 max-w-[1159px] px-4 text-center space-y-6">
        <div className="space-y-2">

          <h1 className="poppins font-semibold text-foreground text-[40px] sm:text-[60px] md:text-[80px] leading-tight tracking-tight">
            Opportunities Made{" "}
            <span className="text-primary kaushan-script font-normal">
              Simple
            </span>
          </h1>

          <h1 className="poppins font-semibold text-foreground text-[40px] sm:text-[60px] md:text-[80px] leading-tight tracking-tight">
            Discover Your Next Event
          </h1>
        </div>

        <p className="w-full max-w-[993px] mx-auto text-center text-muted-foreground text-[18px] md:text-[28px] font-normal leading-normal px-2 inter">
          Connect with events, hackathons, and communities worldwide. Build
          skills, network with professionals, and accelerate your career journey.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 w-full max-w-lg mx-auto">


          <Button
            onClick={() => router.push("/participants")}
            className="
      inline-flex items-center justify-center gap-3
      px-6 py-3
      rounded-[37px]
      bg-primary text-primary-foreground hover:opacity-90
      inter font-semibold text-[20px] leading-[150%]
      shadow-md transition-all hover:-translate-y-1 h-auto
    "
          >
            Find Opportunities
            {/* If you have an arrow icon, put it here */}
          </Button>

          {/* BUTTON 2: Join Communities (Ghost) */}
          <Button
            variant="ghost"
            className="
      inline-flex items-center justify-center gap-3
      px-6 py-3
      rounded-[37px]
      text-primary hover:bg-muted
      inter font-semibold text-[20px] leading-[150%]
      transition-all hover:-translate-y-1 h-auto
    "
          >
            Join Communities
          </Button>

        </div>
      </div>

      <div className="w-full flex justify-center items-center py-6 md:py-10">
        <Image
          src="/hero-banner.png"
          alt="Hero Banner"
          width={1200}
          height={600}
          className="w-full max-w-[1200px] h-auto object-contain px-2 md:px-6"
          priority
        />
      </div>
    </section>
  );
}


































