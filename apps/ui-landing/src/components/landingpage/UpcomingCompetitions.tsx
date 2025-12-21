"use client";

import React from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Mock data based on the reference image
const MOCK_COMPETITIONS = [
  {
    id: 1,
    title: "Hackathon 1.0",
    organizer: "Kalinga Institute of Management",
    tags: ["Free", "Offline"],
    image: "/tmp/hackathon.jpg",
    registerBy: "20 Dec 2024",
    prizes: "₹ 20,000",
  },
];

export default function UpcomingCompetitions() {
  return (
    <section className="w-full py-12 md:py-16 lg:py-20 bg-background">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="mb-8 space-y-2">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl poppins text-foreground">
            Top Competitions
          </h2>
          <p className="text-muted-foreground text-lg inter">
            Discover the most popular competitions students are joining right
            now.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_COMPETITIONS.map((comp) => (
            <Card
              key={comp.id}
              className="p-0 overflow-hidden border-border/50 hover:shadow-md transition-all duration-300 group bg-card"
            >
              {/* Image Section */}
              <div className="relative w-full h-48 sm:h-56 overflow-hidden">
                <Image
                  src={comp.image}
                  alt={comp.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Content Section */}
              <CardContent className="p-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {comp.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className={`text-xs font-normal px-2 py-0.5 rounded-sm ${
                        tag === "Free"
                          ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tag}
                      {tag === "Offline" && " • Offline"}
                      {tag === "Online" && " • Online"}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-semibold leading-tight poppins text-foreground">
                    {comp.title}
                  </h3>
                  <p className="text-sm text-muted-foreground inter line-clamp-1">
                    {comp.organizer}
                  </p>
                </div>
              </CardContent>

              {/* Footer Section */}
              <CardFooter className="p-5 pt-0 flex justify-between items-center text-sm border-t border-border/40 mt-auto bg-muted/5">
                <div className="flex flex-col gap-0.5 mt-3">
                  <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">
                    Register by
                  </span>
                  <span className="font-semibold text-foreground inter">
                    {comp.registerBy}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 mt-3 text-right">
                  <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-wider">
                    Prizes worth
                  </span>
                  <span className="font-semibold text-foreground inter">
                    {comp.prizes}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}

          {/* "Coming Soon" styling matching the reference image's right side graphic if possible? 
              The reference had a "Work" illustration. 
              For now, let's just render the cards. 
          */}
        </div>
      </div>
    </section>
  );
}
