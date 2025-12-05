// src/components/JoinTeamList.tsx
"use client";

import React from "react";
import { useTeams } from "@/hooks/useTeams";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface JoinTeamListProps {
  hackathonId: string;
}

interface Team {
  id: string;
  name: string;
  leader?: { username?: string } | null;
  members?: unknown[];
  maxSize?: number;
}

export function JoinTeamList({ hackathonId }: JoinTeamListProps) {
  const { teamsByHackathon, join } = useTeams();
  const { data: teams, isLoading, error } = teamsByHackathon(hackathonId);


  const handleJoinTeam = (teamId: string) => {
    join.mutate(
      { teamId, hackathonId }, // Your `joinTeam` API takes a CreateTeamDto which has teamId in the implementation
      {
        onSuccess: () => {
         
           console.log("You have successfully joined the team."); 
         
        },
        onError: (error: unknown) => {
          console.log("You have not joined the team.", error); 
        },
      }
    );
  };

  if (isLoading) return <p className="text-center">Loading available teams...</p>;
  if (error) return <p className="text-center text-red-500">Failed to load teams: {(error as Error)?.message ?? String(error)}</p>;

  if (!teams || teams.length === 0) {
    return <p className="text-center text-gray-500">No teams have been created yet. Be the first!</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Available Teams to Join</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {((teams as Team[]) || []).map((team) => (
          <Card key={team.id}>
            <CardHeader>
              <CardTitle className="text-xl">{team.name}</CardTitle>
              <p className="text-sm text-gray-500">Leader: {team.leader?.username ?? "N/A"}</p>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">
                Members: {team.members?.length ?? 0} / {team.maxSize ?? "-"}
              </Badge>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handleJoinTeam(team.id)}
                disabled={(team.members?.length ?? 0) >= (team.maxSize ?? 0) || join.isPending}
              >
                {(team.members?.length ?? 0) >= (team.maxSize ?? 0) ? "Team Full" : "Join Team"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}