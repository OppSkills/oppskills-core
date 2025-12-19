"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichTextEditor from "@/components/ui/editor/RichtextEditor";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface CreateTeamFormProps {
  hackathonId: string;
}

export function CreateTeamForm({ hackathonId }: CreateTeamFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [teamData, setTeamData] = useState({
    name: "",
    description: "",
    maxMembers: "4",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamData.name || !teamData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    console.log("Creating team for hackathon:", hackathonId, teamData);
    toast.success("Team created successfully! (Mock)");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md">
      <h2 className="text-xl font-semibold">Create a New Team</h2>
      <div className="space-y-2">
        <Label htmlFor="teamName">Team Name</Label>
        <Input
          id="teamName"
          placeholder="e.g. The Innovators"
          value={teamData.name}
          onChange={(e) => setTeamData({ ...teamData, name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <RichTextEditor
          placeholder="What is your team building?"
          value={teamData.description}
          onChange={(content) =>
            setTeamData({ ...teamData, description: content })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="maxMembers">Max Size</Label>
        <Input
          id="maxMembers"
          type="number"
          min="2"
          max="6"
          value={teamData.maxMembers}
          onChange={(e) =>
            setTeamData({ ...teamData, maxMembers: e.target.value })
          }
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Create Team
      </Button>
    </form>
  );
}
