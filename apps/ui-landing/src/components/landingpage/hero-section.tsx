import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Rocket } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="min-h-screen -mt-11 bg-background relative overflow-hidden">
      {/* Dots Background Pattern - Light Mode */}
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(rgba(139,69,255,0.6)_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:22px_22px] md:bg-[size:24px_24px] lg:bg-[size:26px_26px] dark:hidden"></div>

      {/* Dots Background Pattern - Dark Mode */}
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(rgba(199,149,255,0.5)_1px,transparent_1px)] bg-[size:20px_20px] sm:bg-[size:22px_22px] md:bg-[size:24px_24px] lg:bg-[size:26px_26px] hidden dark:block"></div>

      {/* Vertical Gradient Overlay - Light Mode */}
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-b from-transparent via-transparent to-background dark:hidden"></div>

      {/* Vertical Gradient Overlay - Dark Mode */}
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-gradient-to-b from-transparent via-transparent to-background hidden dark:block"></div>

      {/* Subtle Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      <div className="absolute top-1/3 right-1/3 w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 left-1/3 w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-48 lg:h-48 bg-primary/5 rounded-full blur-2xl" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-center justify-center min-h-screen py-8 sm:py-10 md:py-12 text-center">
          {/* Main Content */}
          <div className="max-w-[85rem] mx-auto space-y-4 sm:space-y-5">
            {/* Modern Badge */}
            <Badge className="inline-flex items-center gap-1.5 justify-center px-2.5 py-1 bg-primary/8 border border-primary/20 text-primary rounded-full text-xs font-medium poppins backdrop-blur-sm">
              <Badge className="inline-flex items-center gap-2 px-3 py-1 bg-primary/ border border-primary/5 text-primary rounded-full text-xs font-medium poppins backdrop-blur-sm">
                <Rocket className="w-3 h-3 sm:w-4 sm:h-4" /> 
                Launching
              </Badge>
              A Market Mafiaa Initiative
            </Badge>

            {/* Hero Text Container with Dotted Border */}
            <div className="relative py-6 px-2 sm:p-8 md:px-12 md:py-10 lg:px-14 lg:py-10">
              {/* Dotted Border Container */}
              <div className="absolute inset-0 border border-dashed sm:border-2 border-primary/20"></div>

              {/* Corner Lines */}
              <div className="absolute top-0 left-0 w-3 h-3 sm:w-4 sm:h-4">
                <div className="absolute top-0 left-0 w-full h-0.5 bg-black dark:bg-white"></div>
                <div className="absolute top-0 left-0 w-0.5 h-full bg-black dark:bg-white"></div>
              </div>
              <div className="absolute top-0 right-0 w-3 h-3 sm:w-4 sm:h-4">
                <div className="absolute top-0 right-0 w-full h-0.5 bg-black dark:bg-white"></div>
                <div className="absolute top-0 right-0 w-0.5 h-full bg-black dark:bg-white"></div>
              </div>
              <div className="absolute bottom-0 left-0 w-3 h-3 sm:w-4 sm:h-4">
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-black dark:bg-white"></div>
                <div className="absolute bottom-0 left-0 w-0.5 h-full bg-black dark:bg-white"></div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 sm:w-4 sm:h-4">
                <div className="absolute bottom-0 right-0 w-full h-0.5 bg-black dark:bg-white"></div>
                <div className="absolute bottom-0 right-0 w-0.5 h-full bg-black dark:bg-white"></div>
              </div>

              {/* Heading */}
              <div className="space-y-2 sm:space-y-3 relative z-10">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[5.3rem] font-bold leading-tight tracking-tight text-foreground poppins">
                  <span className="text-primary">Opportunities</span> Made
                  Simple
                </h1>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[5.3rem] font-bold leading-tight tracking-tighter text-foreground poppins">
                  Discover Your <span className="text-primary">Next Event</span>
                </h1>
              </div>
            </div>

            {/* Description */}
            <div className="max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto px-2 sm:px-0">
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed inter">
                Connect with events, hackathons, and communities worldwide.
                Build skills, network with professionals, and accelerate your
                career journey.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center w-full max-w-lg mx-auto">
              <Button
                size="lg"
                className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2 h-auto cursor-pointer w-full sm:w-auto"
              >
                Explore Events
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-sm sm:text-base md:text-lg px-6 sm:px-8 py-2 h-auto cursor-pointer w-full sm:w-auto"
              >
                Join Community
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-20 md:h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;