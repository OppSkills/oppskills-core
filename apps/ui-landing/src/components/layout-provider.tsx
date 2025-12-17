"use client";

import Navbar from "./navbar";
import Footer from "./footer";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./layout/app-sidebar";
import { SidebarInset } from "./ui/sidebar";
import { SidebarContextProvider, SidebarProvider } from "./ui/sidebar";
import { SiteHeader } from "./layout/site-header";
import { cn } from "@/lib/utils";
import React from "react";
import { OpportunitySidebar } from "./layout/opportunity-sidebar";

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");

  /**
   * Check if the current route is an opportunity detail page
   * Pattern: /dashboard/opportunity/[slug] or /dashboard/opportunity/[slug]/...
   * Excludes the opportunity list page: /dashboard/opportunity
   */
  const isOpportunityDetail = React.useMemo(() => {
    const opportunityDetailPattern = /^\/dashboard\/opportunity\/[^/]+/;
    return opportunityDetailPattern.test(pathname);
  }, [pathname]);

  /**
   * Control the main sidebar's open state
   * When on opportunity detail pages, force collapse to icon mode
   * Hooks must be at the top level, not inside conditionals
   */
  const [mainSidebarOpen, setMainSidebarOpen] =
    React.useState(!isOpportunityDetail);

  /**
   * Update main sidebar state when route changes
   * Collapse main sidebar when entering opportunity detail pages
   */
  React.useEffect(() => {
    setMainSidebarOpen(!isOpportunityDetail);
  }, [isOpportunityDetail]);

  // Dashboard layout with dual-sidebar support for opportunity details
  if (isDashboard) {
    return (
      <main className="">
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 62)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
          className="bg-neutral-200"
          open={mainSidebarOpen}
          onOpenChange={setMainSidebarOpen}
        >
          {/* Main application sidebar - collapses to icon mode on opportunity details */}
          <AppSidebar variant="floating" className="" />

          {/* Secondary opportunity sidebar - only visible on opportunity detail pages */}
          {isOpportunityDetail ? (
            <SidebarContextProvider defaultOpen={true}>
              <OpportunitySidebar
                side="left"
                variant="floating"
                collapsible="icon"
                style={{
                  left: "calc(var(--sidebar-width-icon) + 1rem)",
                }}
              />
              <SidebarInset className={cn("bg-neutral-200 p-2 space-y-4 my-1")}>
                <SiteHeader />
                <div className="rounded-[20px] overflow-hidden">{children}</div>
              </SidebarInset>
            </SidebarContextProvider>
          ) : (
            <SidebarInset className={cn("bg-neutral-200 p-2 space-y-4 my-1")}>
              <SiteHeader />
              <div className="rounded-[20px] overflow-hidden">{children}</div>
            </SidebarInset>
          )}
        </SidebarProvider>
      </main>
    );
  }

  // Non-dashboard layout (landing pages, etc.)
  return (
    <main>
      <Navbar />
      {children}
      <Footer />
      <Toaster position="bottom-right" duration={5000} richColors />
    </main>
  );
}
