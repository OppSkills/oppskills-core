// src/components/CreateTeamForm.tsx
"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useTeams } from "@/hooks/useTeams";

interface CreateTeamFormProps {
  hackathonId: string;
}

export function CreateTeamForm({ hackathonId }: CreateTeamFormProps) {
  const [teamName, setTeamName] = useState("");
  const [maxSize, setMaxSize] = useState(4); // Default size
  const { create } = useTeams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamName || maxSize < 2) {
    console.log("Please enter a valid team name and max size (min 2).")
      return;
    }

    create.mutate(
      { name: teamName, maxSize, hackathonId },
      {
        onSuccess: (data) => {
          const result = data as Record<string, unknown>;
          console.log(`Team '${(result.name as string) ?? ""}' created successfully.`);
        },
        onError: (error: unknown) => {
          console.log("Could not create team", error);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h2 className="text-xl font-semibold">Team Leader Registration</h2>
      <div className="space-y-2">
        <Label htmlFor="teamName">Team Name</Label>
        <Input
          id="teamName"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="e.g., Code Warriors"
          required
          disabled={create.isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxSize">Max Team Size (Min 2)</Label>
        <Input
          id="maxSize"
          type="number"
          value={maxSize}
          onChange={(e) => setMaxSize(parseInt(e.target.value) || 2)}
          min={2}
          max={10} // Example max limit
          required
          disabled={create.isPending}
        />
      </div>
      <Button type="submit" className="w-full" disabled={create.isPending}>
        {create.isPending ? "Creating Team..." : "Create Team & Register"}
      </Button>
    </form>
  );
}