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
import { EventsSidebar } from "./layout/events-sidebar";
import { MobileNavigationProvider } from "./layout/mobile-navigation-context";

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isOnboarding = pathname.startsWith("/onboarding");

  // Onboarding page - no header, footer, or sidebar
  if (isOnboarding) {
    return (
      <main className="min-h-screen bg-background">
        {children}
        <Toaster position="bottom-right" duration={5000} richColors />
      </main>
    );
  }

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
   * Check if the current route is in the events section
   * Pattern: /dashboard/events/[slug]...
   * Excludes the events list page: /dashboard/events
   */
  const [isEventsDashboard, eventsSlug] = React.useMemo(() => {
    const eventsDetailPattern = /^\/dashboard\/events\/([^/]+)/;
    const match = pathname.match(eventsDetailPattern);
    if (match) {
      return [true, match[1]];
    }
    return [false, null];
  }, [pathname]);

  const hasSecondarySidebar = isOpportunityDetail || isEventsDashboard;

  /**
   * Control the main sidebar's open state
   * When on opportunity detail pages or events dashboard, force collapse to icon mode
   * Hooks must be at the top level, not inside conditionals
   */
  const [mainSidebarOpen, setMainSidebarOpen] =
    React.useState(!hasSecondarySidebar);

  /**
   * Update main sidebar state when route changes
   * Collapse main sidebar when entering detailed/secondary sections
   */
  React.useEffect(() => {
    setMainSidebarOpen(!hasSecondarySidebar);
  }, [hasSecondarySidebar]);

  // Mobile sidebar state management
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [activeMobileTab, setActiveMobileTab] = React.useState<
    "main" | "secondary"
  >("secondary");

  // Dashboard layout with dual-sidebar support
  if (isDashboard) {
    return (
      <MobileNavigationProvider
        value={{
          mobileMenuOpen,
          setMobileMenuOpen,
          activeMobileTab,
          setActiveMobileTab,
          isOpportunityDetail: hasSecondarySidebar,
        }}
      >
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
            openMobile={activeMobileTab === "main" && mobileMenuOpen}
            onOpenMobileChange={(open) => {
              setMobileMenuOpen(open);
              if (open) setActiveMobileTab("main");
            }}
          >
            {/* Main application sidebar - collapses to icon mode on detail pages */}
            <AppSidebar variant="floating" className="" />

            {/* Secondary sidebar - only visible on specific detailed pages */}
            {hasSecondarySidebar ? (
              <SidebarContextProvider
                defaultOpen={true}
                openMobile={activeMobileTab === "secondary" && mobileMenuOpen}
                onOpenMobileChange={(open) => {
                  setMobileMenuOpen(open);
                  if (open) setActiveMobileTab("secondary");
                }}
              >
                {isOpportunityDetail && (
                  <OpportunitySidebar
                    side="left"
                    variant="floating"
                    collapsible="icon"
                    style={{
                      left: "calc(var(--sidebar-width-icon) + 1rem)",
                    }}
                  />
                )}
                {isEventsDashboard && eventsSlug && (
                  <EventsSidebar
                    slug={eventsSlug}
                    side="left"
                    variant="floating"
                    collapsible="icon"
                    style={{
                      left: "calc(var(--sidebar-width-icon) + 1rem)",
                    }}
                  />
                )}
                <SidebarInset
                  className={cn("bg-neutral-200 p-2 space-y-4 my-1")}
                >
                  <SiteHeader />
                  <div
                    className="flex-1 flex min-h-0 rounded-[20px] overflow-hidden w-full min-w-0 bg-background
"
                  >
                    {children}
                  </div>
                </SidebarInset>
              </SidebarContextProvider>
            ) : (
              <SidebarInset className={cn("bg-neutral-200 p-2 space-y-4 my-1")}>
                <SiteHeader />
                <div className="flex flex-1 rounded-[20px] overflow-hidden w-full min-w-0 bg-background">
                  {children}
                </div>
              </SidebarInset>
            )}
          </SidebarProvider>
        </main>
      </MobileNavigationProvider>
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
