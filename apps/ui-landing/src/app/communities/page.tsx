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
import { Users, ExternalLink } from "lucide-react";

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
  },
  {
    id: 4,
    name: "Blockchain Builders",
    members: "5.4k",
    description: "Building the decentralized future, one block at a time.",
    image:
      "https://images.unsplash.com/photo-1639322537228-ad71c4295843?q=80&w=600&auto=format&fit=crop",
    tags: ["Web3", "Crypto", "Solidity"],
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
  },
];

export default function CommunitiesPage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container px-4 md:px-6">
        <div className="mb-12 flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Join a Community
          </h1>
          <p className="mt-4 max-w-[700px] text-muted-foreground md:text-xl">
            Connect with peers, find mentors, and grow your network. Explore
            communities tailored to your interests.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {COMMUNITIES.map((community) => (
            <Card
              key={community.id}
              className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50"
            >
              <div className="h-32 w-full overflow-hidden bg-muted">
                <img
                  src={community.image}
                  alt={community.name}
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardHeader className="relative pb-2">
                <div className="absolute -top-10 left-6 rounded-full border-4 border-background bg-background">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${community.name}`}
                    />
                    <AvatarFallback>
                      {community.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="pt-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold">{community.name}</h3>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Users className="h-3 w-3" />
                      {community.members}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                  {community.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {community.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="text-xs font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button className="w-full" variant="outline">
                  View Community <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
