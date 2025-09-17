import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap } from "lucide-react";

const HackathonCTA = () => {
  return (
    <section className="py-16 sm:py-20 md:py-24 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-secondary/10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-primary rounded-full mix-blend-multiply filter blur-xl" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-xl" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-card max-w-[90rem] mx-auto border border-border/60 rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-500 overflow-hidden">
          <div className="p-6 sm:p-8 md:p-12 lg:px-16">
            {/* Header */}
            <div className="mb-8">
              <Badge
                variant="secondary"
                className="mb-6 px-4 py-2 text-sm font-medium"
              >
                <Zap className="w-4 h-4 mr-2" />
                Join Hackathons
              </Badge>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2.5 leading-tight">
                Compete, code, and{" "}
                <span className="text-primary">win big prizes</span>
              </h2>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                Challenge yourself in intense coding competitions across India,
                build innovative solutions, and compete for amazing cash prizes
                while networking with top developers.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                className="h-12 px-6 sm:px-8 text-base font-medium group"
              >
                Join next hackathon
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 sm:px-8 text-base"
              >
                Browse competitions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HackathonCTA;
