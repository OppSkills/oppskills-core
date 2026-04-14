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
import { HackathonSidebar } from "./layout/hackathon-sidebar";
import { EventsSidebar } from "./layout/events-sidebar";
import { FestivalsSidebar } from "./layout/festivals-sidebar";
import { MobileNavigationProvider } from "./layout/mobile-navigation-context";

export default function LayoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isProfile = pathname.startsWith("/profile");
  const isOnboarding = pathname.startsWith("/onboarding");

  // Onboarding page - no header, footer, or sidebar
  if (isOnboarding || isProfile) {
    return (
      <main className="min-h-screen bg-neutral-200">

        {children as any}
        <Toaster position="bottom-right" duration={5000} richColors />
      </main>
    );
  }

  /**
   * Check if the current route is an hackathon detail page
   * Pattern: /dashboard/hackathon/[slug] or /dashboard/hackathon/[slug]/...
   * Excludes the hackathon list page: /dashboard/hackathon
   */
  const ishackathonDetail = React.useMemo(() => {
    const hackathonDetailPattern = /^\/dashboard\/hackathon\/[^/]+/;
    return hackathonDetailPattern.test(pathname);
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

  /**
   * Check if the current route is in the festivals section
   * Pattern: /dashboard/festivals/[slug]...
   * Excludes the festivals list page: /dashboard/festivals
   */
  const [isFestivalsDashboard, festivalsSlug] = React.useMemo(() => {
    const festivalsDetailPattern = /^\/dashboard\/festivals\/([^/]+)/;
    const match = pathname.match(festivalsDetailPattern);
    if (match) {
      return [true, match[1]];
    }
    return [false, null];
  }, [pathname]);

  const hasSecondarySidebar =
    ishackathonDetail || isEventsDashboard || isFestivalsDashboard;

  /**
   * Control the main sidebar's open state
   * When on hackathon detail pages or events dashboard, force collapse to icon mode
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
          ishackathonDetail: hasSecondarySidebar,
        }}
      >
        <main className="h-svh overflow-hidden">
          <SidebarProvider
            style={
              {
                "--sidebar-width": "calc(var(--spacing) * 64)",
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
            <div>
              <AppSidebar 
                variant="sidebar" 
              />
            </div>

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
                {ishackathonDetail && (
                  <HackathonSidebar
                    side="left"
                    variant="sidebar"
                    collapsible="icon"
                    style={{
                      "--sidebar-width": "12rem",
                      left: "64px",
                    } as React.CSSProperties}
                  />
                )}
                {isEventsDashboard && eventsSlug && (
                  <EventsSidebar
                    slug={eventsSlug}
                    side="left"
                    variant="sidebar"
                    collapsible="icon"
                    style={{
                      "--sidebar-width": "12rem",
                      left: "64px",
                    } as React.CSSProperties}
                  />
                )}
                {isFestivalsDashboard && festivalsSlug && (
                  <FestivalsSidebar
                    slug={festivalsSlug}
                    side="left"
                    variant="sidebar"
                    collapsible="icon"
                    style={{
                      "--sidebar-width": "12rem",
                      left: "64px",
                    } as React.CSSProperties}
                  />
                )}
                <SidebarInset
                  className={cn("bg-background overflow-hidden h-svh")}
                >
                  <SiteHeader />
                  <div
                    className="flex-1 flex min-h-0 overflow-y-auto w-full min-w-0 bg-background"
                  >

                    {children as any}
                  </div>
                </SidebarInset>
              </SidebarContextProvider>
            ) : (
              <SidebarInset className={cn("bg-background overflow-hidden h-svh")}>
                <SiteHeader />
                <div className="flex flex-1 overflow-y-auto w-full min-w-0 bg-background">

                  {children as any}
                </div>
              </SidebarInset>
            )}
          </SidebarProvider>
          <Toaster position="bottom-right" duration={5000} richColors />
        </main>
      </MobileNavigationProvider>
    );
  }

  // Non-dashboard layout (landing pages, etc.)
  return (
    <main>
      <Navbar />

      {children as any}
      <Footer />
      <Toaster position="bottom-right" duration={5000} richColors />
    </main>
  );
}
