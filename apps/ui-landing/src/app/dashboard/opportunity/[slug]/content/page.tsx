import React from "react";

/**
 * Content page for opportunity detail
 * Manage the content and materials for the opportunity
 */
export default function ContentPage() {
  return (
    <div className="flex w-full justify-center bg-surface min-h-screen">
      <div className="w-full max-w-[1150px] p-10 rounded-[20px] bg-background">
        <h1 className="text-3xl font-bold mb-6">Content</h1>
        <p className="text-muted-foreground">
          Manage content, resources, and materials for this opportunity.
        </p>
        {/* TODO: Implement content management interface */}
      </div>
    </div>
  );
}

