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

  /**
   * Type guard: checks if a value is a non-null object.
   */
  const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;

  /**
   * Extracts a list from API responses that may be either:
   * - an array directly, OR
   * - an object with a `data` array.
   */
  const hackathons: ReadonlyArray<unknown> = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data["data"])
      ? (data["data"] as ReadonlyArray<unknown>)
      : [];

  /**
   * Safe string accessor from unknown records.
   */
  const getString = (
    obj: Record<string, unknown>,
    key: string
  ): string | undefined => {
    const value = obj[key];
    return typeof value === "string" && value.trim().length > 0
      ? value
      : undefined;
  };

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
      {hackathons.map((row, idx) => {
        if (!isRecord(row)) return null;

        const id = getString(row, "id") ?? `row-${idx}`;
        const title =
          getString(row, "name") ??
          getString(row, "title") ??
          "Untitled Hackathon";
        const description = getString(row, "description") ?? "";
        const startDate = getString(row, "startDate") ?? "";
        const endDate = getString(row, "endDate") ?? "";
        const mode = getString(row, "mode") ?? "";
        const ownerId =
          getString(row, "ownerId") ?? getString(row, "organizerId") ?? "";

        // Check if the current user is the owner of this hackathon
        const isOwner = typeof userId === "string" && ownerId === userId;

        return (
          <Card key={id} className="shadow-md border border-gray-200">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Start:</span>
                <Badge variant="secondary">
                  {startDate.length > 0 ? formatDate(startDate) : "N/A"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">End:</span>
                <Badge variant="secondary">
                  {endDate.length > 0 ? formatDate(endDate) : "N/A"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">Mode:</span>
                <Badge className="capitalize">
                  {mode.length > 0 ? mode : "N/A"}
                </Badge>
              </div>

              {/* Conditional Rendering for Owner vs. Participant */}
              {isOwner ? (
                <Button
                  onClick={() => handleViewClick(id)}
                  className="mt-4 w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  View/Manage Your Hackathon
                </Button>
              ) : (
                <Button
                  onClick={() => handleRegisterClick(id)}
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
