import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Users,
  Calendar,
  Megaphone,
  Target,
  Star,
  CheckCircle,
  PlusCircle,
  BarChart3,
} from "lucide-react";

interface Benefit {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  text: string;
}

interface Stat {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  value: string;
  label: string;
}

const CTA = () => {
  const benefits: Benefit[] = [
    { icon: Users, text: "Access to 45K+ active developers" },
    { icon: Megaphone, text: "Powerful promotional tools" },
    { icon: Target, text: "Targeted audience matching" },
    { icon: BarChart3, text: "Detailed analytics & insights" },
  ];

  const stats: Stat[] = [
    {
      icon: Users,
      value: "45K+",
      label: "Potential attendees",
    },
    {
      icon: Calendar,
      value: "850+",
      label: "Events hosted",
    },
    {
      icon: Target,
      value: "89%",
      label: "Fill rate average",
    },
    {
      icon: BarChart3,
      value: "95%",
      label: "Return organizers",
    },
  ];

  const avatarLetters: string[] = ["T", "G", "M", "A"];

  return (
    <section className="py-20 sm:py-24 lg:py-32 bg-gradient-to-b from-background via-primary/[0.02] to-secondary/5 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500 rounded-full mix-blend-multiply filter blur-xl" />
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-xl" />
      </div>

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="bg-card border border-border/60 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-500 overflow-hidden">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-0">
            {/* Content Section */}
            <div className="lg:col-span-3 p-8 sm:p-12 lg:p-16 lg:pr-8">
              <div className="max-w-2xl">
                {/* Header */}
                <div className="mb-8">
                  <Badge
                    variant="secondary"
                    className="mb-6 px-4 py-2 text-sm font-medium"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Host Your Event
                  </Badge>

                  <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                    Reach thousands of{" "}
                    <span className="text-primary-500 relative">
                      tech professionals
                    </span>
                  </h2>

                  <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                    Host your workshop, conference, or meetup on our platform
                    and connect with passionate developers, designers, and tech
                    enthusiasts ready to learn.
                  </p>
                </div>

                {/* Benefits */}
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  {benefits.map((benefit: Benefit, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 text-sm"
                    >
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-muted-foreground">
                        {benefit.text}
                      </span>
                    </div>
                  ))}
                </div>
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button
                    size="lg"
                    className="h-12 px-8 text-base font-medium group"
                  >
                    Host your event
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>

                {/* Social Proof */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {avatarLetters.map((letter: string, index: number) => (
                        <div
                          key={index}
                          className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 border-2 border-background flex items-center justify-center text-xs font-bold text-primary"
                        >
                          {letter}
                        </div>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground ml-2">
                      500+ successful events
                    </span>
                  </div>

                  <div className="md:flex items-center gap-1 hidden">
                    <div className="flex">
                      {Array.from({ length: 5 }, (_, index: number) => (
                        <Star
                          key={index}
                          className="w-4 h-4 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground ml-1">
                      4.8/5 organizer satisfaction
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="lg:col-span-2 bg-secondary/20 p-8 sm:p-12 lg:p-16 flex items-center">
              <div className="w-full max-w-sm mx-auto lg:max-w-none">
                <div className="grid grid-cols-2 gap-6">
                  {stats.map((stat: Stat, index: number) => {
                    const IconComponent = stat.icon;
                    return (
                      <div key={index} className="text-center lg:text-left">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                          <IconComponent className="w-6 h-6 text-primary" />
                        </div>
                        <div className="text-3xl font-bold text-foreground mb-1">
                          {stat.value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
