import React from "react";

/**
 * Settings page for opportunity detail
 * Configure settings and preferences for the opportunity
 */
export default function SettingsPage() {
  return (
    <div className="flex w-full justify-center bg-surface min-h-screen">
      <div className="w-full max-w-[1150px] p-10 rounded-[20px] bg-background">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <p className="text-muted-foreground">
          Configure settings and preferences for this opportunity.
        </p>
        {/* TODO: Implement settings form */}
      </div>
    </div>
  );
}

