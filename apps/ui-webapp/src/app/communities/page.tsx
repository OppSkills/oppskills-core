"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, ExternalLink, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";

// Mock Data
const COMMUNITIES = [
  {
    id: 1,
    name: "Web Dev Pros",
    members: "12.5k",
    description:
      "A community for full-stack developers to share knowledge and projects.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop",
    tags: ["Web Development", "JavaScript", "React"],
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: 2,
    name: "AI Enthusiasts",
    members: "8.2k",
    description:
      "Exploring the frontiers of Artificial Intelligence and Machine Learning.",
    image:
      "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=600&auto=format&fit=crop",
    tags: ["AI", "ML", "Python"],
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: 3,
    name: "Design Hub",
    members: "15k",
    description:
      "Where creativity meets functionality. For UI/UX designers and artists.",
    image:
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600&auto=format&fit=crop",
    tags: ["UI/UX", "Figma", "Design"],
    color: "from-orange-500/20 to-red-500/20",
  },
  {
    id: 4,
    name: "Blockchain Builders",
    members: "5.4k",
    description: "Building the decentralized future, one block at a time.",
    image:
      "https://images.unsplash.com/photo-1639322537228-ad71c4295843?q=80&w=600&auto=format&fit=crop",
    tags: ["Web3", "Crypto", "Solidity"],
    color: "from-green-500/20 to-emerald-500/20",
  },
  {
    id: 5,
    name: "Data Science Network",
    members: "9.1k",
    description:
      "Connect with data scientists and analysts from around the globe.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop",
    tags: ["Data Science", "Analytics", "R"],
    color: "from-indigo-500/20 to-violet-500/20",
  },
  {
    id: 6,
    name: "CyberSecurity Front",
    members: "3.8k",
    description:
      "Discussions on network security, ethical hacking, and defense.",
    image:
      "https://images.unsplash.com/photo-1563206767-5b1d972b9325?q=80&w=600&auto=format&fit=crop",
    tags: ["Security", "Hacking", "InfoSec"],
    color: "from-red-500/20 to-rose-500/20",
  },
];

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 pb-20 flex flex-col items-center justify-center">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] mix-blend-multiply  animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] mix-blend-multiply  animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-[120px] mix-blend-multiply  animate-blob animation-delay-4000" />
      </div>

      <div className="container px-4 md:px-6 py-12 md:py-24 mx-auto relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-16 space-y-6">
          <Badge
            variant="outline"
            className="px-4 py-1.5 rounded-full border-primary/20 bg-primary/5 text-primary-500 text-sm font-medium gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Discover Your Tribe
          </Badge>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 pb-2 font-poppins">
            Join a Community
          </h1>

          <p className="max-w-2xl text-muted-foreground text-lg md:text-xl leading-relaxed">
            Connect with peers, find mentors, and grow your network. Explore
            specialized communities tailored to your interests and career goals.
          </p>

          <div className="relative w-full max-w-lg mt-8 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-background rounded-lg border border-input shadow-sm">
              <Search className="absolute left-3 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search for communities..."
                className="pl-10 h-12 border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-base"
              />
              <Button className="m-1 h-10 px-6 rounded-md font-medium shadow-none">
                Search
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITIES.map((community) => (
            <Card
              key={community.id}
              className="group overflow-hidden border-border/50 bg-background/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 "
            >
              <div className="relative h-40 w-full overflow-hidden">
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${community.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none`}
                />
                <img
                  src={community.image}
                  alt={community.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              <CardHeader className="relative pb-2 -mt-12 z-20">
                <div className="flex justify-between items-end mb-2">
                  <div className="rounded-2xl border-4 border-background bg-background shadow-sm overflow-hidden h-20 w-20 flex-shrink-0">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${community.name}`}
                        className="object-cover"
                      />
                      <AvatarFallback className="rounded-none bg-primary/10 text-primary-500 font-bold text-xl">
                        {community.name.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <Badge
                    variant="secondary"
                    className="mb-4 bg-background/80 backdrop-blur-md border border-border/50 shadow-sm"
                  >
                    <Users className="h-3 w-3 mr-1 text-primary" />
                    {community.members}
                  </Badge>
                </div>

                <div className="pt-2">
                  <h3 className="text-xl font-bold font-poppins group-hover:text-primary-500 transition-colors">
                    {community.name}
                  </h3>
                </div>
              </CardHeader>

              <CardContent className="pb-6">
                <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4 leading-relaxed">
                  {community.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {community.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs font-medium bg-muted/30 border-muted-foreground/20 text-muted-foreground group-hover:border-primary/20 group-hover:text-primary-500 group-hover:bg-primary/5 transition-colors"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-6">
                <Button className="w-full group/btn" variant="outline">
                  View Community
                  <ExternalLink className="ml-2 h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
