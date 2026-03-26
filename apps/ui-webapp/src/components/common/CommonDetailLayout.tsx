"use client";

import React, { ReactNode } from "react";

interface CommonDetailLayoutProps {
  sidebar: ReactNode;
  children: ReactNode; // Main content
  title?: string;
  className?: string;
}

/**
 * A shared layout component for opportunity detail pages (Festivals, Hackathons, Events).
 * Provides a standard grid with a sidebar on the left (lg:col-span-4) 
 * and main content on the right (lg:col-span-8).
 */
export function CommonDetailLayout({
  sidebar,
  children,
  title,
  className = "",
}: CommonDetailLayoutProps) {
  return (
    <div className={`min-h-screen bg-transparent lg:pt-8 pb-8 font-sans ${className}`}>
      {/* Main Container - Full width with padding */}
      <div className="w-full px-0 sm:px-8 md:px-12 lg:px-16 xl:px-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
          
          {/* LEFT COLUMN: Sidebar Area */}
          <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
            {sidebar}
          </div>

          {/* RIGHT COLUMN: Main Content Area */}
          <div className="lg:col-span-8 space-y-8 px-4 sm:px-0">
            {title && (
              <div className="mb-6 mt-3 lg:mt-0">
                <h1 className="text-neutral-900 text-3xl lg:text-4xl font-semibold leading-tight">
                  {title}
                </h1>
              </div>
            )}
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
