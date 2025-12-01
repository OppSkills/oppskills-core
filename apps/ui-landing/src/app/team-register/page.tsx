"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { CreateTeamForm } from "@/components/CreateTeamForm"; // Component to be created
import { JoinTeamList } from "@/components/JoinTeamList"; // Component to be created

type RegistrationMode = "CREATE" | "JOIN";

export default function RegistrationPage() {
    const params = useSearchParams();
const hackathonId = params.get("hackathonId");

  const [mode, setMode] = useState<RegistrationMode>("JOIN");

  if (!hackathonId) {
    return <p className="p-8 text-center text-red-500">Hackathon ID missing.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 space-y-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-center">
        Hackathon Registration
      </h1>
      <p className="text-center text-gray-600">
        Choose to **create a new team** or **join an existing one** for this hackathon.
      </p>

      <div className="flex justify-center gap-4 my-6">
        <Button
          variant={mode === "CREATE" ? "default" : "outline"}
          onClick={() => setMode("CREATE")}
        >
          ➕ Create New Team
        </Button>
        <Button
          variant={mode === "JOIN" ? "default" : "outline"}
          onClick={() => setMode("JOIN")}
        >
          🤝 Join Existing Team
        </Button>
      </div>

      <Separator />

      {mode === "CREATE" ? (
        <CreateTeamForm hackathonId={hackathonId} />
      ) : (
        <JoinTeamList hackathonId={hackathonId} />
      )}
    </div>
  );
}