import React from "react";

/**
 * Overview page for opportunity detail
 * Shows the main dashboard and overview information for the opportunity
 */
export default function OpportunityOverviewPage() {
  return (
    <div className="flex w-full justify-center bg-surface min-h-screen">
      <div className="w-full max-w-[1150px] p-10 rounded-[20px] bg-background">
        <h1 className="text-3xl font-bold mb-6">Opportunity Overview</h1>
        <p className="text-muted-foreground">
          View the overview and key metrics for this opportunity.
        </p>
        {/* TODO: Implement overview dashboard with stats and charts */}
      </div>
    </div>
  );
}
