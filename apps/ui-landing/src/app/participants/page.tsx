"use client";

import { usePublicHackathons } from "@/hooks/usePublicHackathons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export default function HackathonList() {
  const { data, isLoading, error } = usePublicHackathons();
  const router = useRouter();
  const { userId } = useAuth();

  if (isLoading)
    return <p className="p-6 text-center">Loading hackathons...</p>;
  if (error)
    return (
      <p className="p-6 text-center text-red-500">Failed to load hackathons.</p>
    );

  const hackathons = data?.pages.flat() ?? [];

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

  const handleViewClick = (hackathonId: string) => {
    router.push(`/manage/hackathon/${hackathonId}`);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-6">
      {hackathons.map((row) => {
        const id = row.id;
        const title = row.name ?? "Untitled Hackathon";
        const description = row.description ?? "";
        const startDate = row.startDate ?? "";
        const endDate = row.endDate ?? "";
        const mode = row.mode ?? "";
        const ownerId = row.owner?.id ?? "";

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
                <span>{startDate ? formatDate(startDate) : "TBD"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">End:</span>
                <span>{endDate ? formatDate(endDate) : "TBD"}</span>
              </div>
              {mode && (
                <Badge variant="outline" className="capitalize">
                  {mode.toLowerCase()}
                </Badge>
              )}
              <div className="flex gap-2 pt-2">
                {isOwner ? (
                  <Button
                    variant="secondary"
                    onClick={() => handleViewClick(id)}
                  >
                    Manage
                  </Button>
                ) : (
                  <Button onClick={() => handleRegisterClick(id)}>
                    Register
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {hackathons.length === 0 && (
        <p className="text-center text-muted-foreground py-8">
          No hackathons available at the moment.
        </p>
      )}
    </div>
  );
}
