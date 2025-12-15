import React from "react";

/**
 * Participants page for opportunity detail
 * Shows the list of participants registered for the opportunity
 */
export default function ParticipantsPage() {
  return (
    <div className="flex w-full justify-center bg-surface min-h-screen">
      <div className="w-full max-w-[1150px] p-10 rounded-[20px] bg-background">
        <h1 className="text-3xl font-bold mb-6">Participants</h1>
        <p className="text-muted-foreground">
          View and manage participants registered for this opportunity.
        </p>
        {/* TODO: Implement participants table */}
      </div>
    </div>
  );
}

