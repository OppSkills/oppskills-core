import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Code,
  Trophy,
  MessageSquare,
  Briefcase,
  Target,
  Network,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

interface Feature {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  benefits: string[];
  accent: string;
}

interface IntegrationItem {
  text: string;
}

const FeaturesSection = () => {
  const features: Feature[] = [
    {
      icon: Users,
      title: "Join Communities",
      description:
        "Connect with like-minded professionals in tech communities tailored to your interests and career goals.",
      benefits: ["Expert-led discussions", "Peer networking", "Skill sharing"],
      accent: "bg-blue-500",
    },
    {
      icon: Calendar,
      title: "Attend Events",
      description:
        "Participate in workshops, conferences, and meetups designed to enhance your skills and expand your network.",
      benefits: [
        "Industry insights",
        "Hands-on learning",
        "Certificate opportunities",
      ],
      accent: "bg-green-500",
    },
    {
      icon: Code,
      title: "Compete in Hackathons",
      description:
        "Challenge yourself in coding competitions, build innovative solutions, and win exciting prizes.",
      benefits: [
        "Real-world projects",
        "Team collaboration",
        "Prize competitions",
      ],
      accent: "bg-purple-500",
    },
    {
      icon: Briefcase,
      title: "Career Opportunities",
      description:
        "Discover job openings, internships, and freelance projects shared by community members and partners.",
      benefits: ["Exclusive job posts", "Referral network", "Career guidance"],
      accent: "bg-orange-500",
    },
    {
      icon: MessageSquare,
      title: "Knowledge Sharing",
      description:
        "Share your expertise, ask questions, and learn from industry professionals through discussions and forums.",
      benefits: ["Q&A forums", "Best practices", "Code reviews"],
      accent: "bg-pink-500",
    },
    {
      icon: Trophy,
      title: "Recognition & Achievements",
      description:
        "Earn badges, certificates, and recognition for your contributions and achievements within the community.",
      benefits: ["Digital badges", "Skill certificates", "Leaderboards"],
      accent: "bg-yellow-500",
    },
  ];

  const integrationItems: IntegrationItem[] = [
    { text: "Real-time notifications for opportunities" },
    { text: "Integrated calendar for all your events" },
    { text: "Progress tracking and skill analytics" },
    { text: "Direct messaging with community members" },
  ];

  return (
    <section className="py-16 sm:py-20 bg-secondary/30 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />

      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="mb-12">
          <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Target className="w-4 h-4" />
            Platform Features
          </Badge>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            Why choose <span className="text-primary">OppSkills</span>
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Our comprehensive platform provides all the tools and opportunities
            you need to advance your technical skills and professional network.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 sm:mb-20">
          {features.map((feature: Feature, index: number) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/20 hover:shadow-lg transition-all duration-300"
              >
                {/* Icon */}
                <div className="relative mb-6">
                  <div
                    className={`w-12 h-12 rounded-xl ${feature.accent}/10 flex items-center justify-center mb-4`}
                  >
                    <IconComponent
                      className={`w-12 h-12 rounded-md bg-secondary p-2.5 text-${
                        feature.accent.split("-")[1]
                      }-500`}
                    />
                  </div>
                  <div
                    className={`absolute top-0 left-0 w-12 h-12 ${feature.accent}/20 rounded-xl blur-xl`}
                  />
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Benefits */}
                  <ul className="space-y-2 hidden">
                    {feature.benefits.map((benefit: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Integration Preview */}
        <div className="lg:grid-cols-2 gap-12 items-center hidden">
          <div className="space-y-8">
            <div className="space-y-6">
              <Badge variant="secondary" className="px-4 py-2">
                <Network className="w-4 h-4 mr-2" />
                Seamless Integration
              </Badge>

              <h3 className="text-3xl sm:text-4xl font-bold text-foreground">
                All your professional growth in{" "}
                <span className="text-primary">one place</span>
              </h3>

              <p className="text-lg text-muted-foreground leading-relaxed">
                From networking to skill development, job hunting to project
                collaboration – everything you need for career advancement is
                integrated into a single, intuitive platform.
              </p>
            </div>

            <div className="space-y-4">
              {integrationItems.map((item: IntegrationItem, index: number) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>

            <Button className="group">
              Explore Platform
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-8 border border-border/50">
              <div className="space-y-6">
                {/* Mock Dashboard Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs font-medium text-foreground">
                        Live Event
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      React Workshop
                    </div>
                  </div>

                  <div className="bg-card rounded-lg p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-xs font-medium text-foreground">
                        New Message
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sarah in AI Community
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-4 border border-border/50">
                  <div className="text-sm font-medium text-foreground mb-3">
                    Your Progress
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        JavaScript Skills
                      </span>
                      <span className="text-primary font-medium">85%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full w-[85%]" />
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-lg p-4 border border-border/50">
                  <div className="text-sm font-medium text-foreground mb-2">
                    Upcoming Hackathon
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AI Innovation Challenge
                  </div>
                  <div className="text-xs text-primary font-medium mt-1">
                    Starting in 3 days
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
