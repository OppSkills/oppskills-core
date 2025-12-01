// src/app/hackathonlist.tsx
"use client";

import React from "react";
import { useHackathons } from "@/hooks/useHackathons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs"; 

export default function HackathonList() {
  const { data, isLoading, error } = useHackathons();
  const router = useRouter();
  const { userId } = useAuth(); 

  if (isLoading)
    return <p className="p-6 text-center">Loading hackathons...</p>;
  if (error)
    return (
      <p className="p-6 text-center text-red-500">Failed to load hackathons.</p>
    );

  const hackathons = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
      ? data.data
      : [];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRegisterClick = (hackathonId: string) => {
    router.push(`/team-register?hackathonId=${hackathonId}`);
  };

  // New handler for the owner's dashboard link
  const handleViewClick = (hackathonId: string) => {
    // NOTE: Use your actual hackathon management route here
    router.push(`/manage/hackathon/${hackathonId}`);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {hackathons.map((hack) => {
        // Check if the current user is the owner of this hackathon
        const isOwner = userId && hack.ownerId === userId;

        return (
          <Card key={hack.id} className="shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {hack.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {hack.description}
              </p>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Start:</span>
                <Badge variant="secondary">{formatDate(hack.startDate)}</Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">End:</span>
                <Badge variant="secondary">{formatDate(hack.endDate)}</Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Mode:</span>
                <Badge className="capitalize">{hack.mode}</Badge>
              </div>

              {/* Conditional Rendering for Owner vs. Participant */}
              {isOwner ? (
                <Button
                  onClick={() => handleViewClick(hack.id)}
                  className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700"
                >
                   View/Manage Your Hackathon
                </Button>
              ) : (
                <Button
                  onClick={() => handleRegisterClick(hack.id)}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
                >
                  Register Now
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
