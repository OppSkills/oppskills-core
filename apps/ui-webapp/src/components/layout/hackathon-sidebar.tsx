"use client";
import * as React from "react";

import { MobileSidebarSwitcher } from "./mobile-sidebar-switcher";
import { SidebarFooter } from "@/components/ui/sidebar";
import { NavMain } from "./nav-main";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useParams } from "next/navigation";
import { Card, Checklist, NotificationUnreadLines, Pen2, Settings, UserId, Widget2 } from "@solar-icons/react";

/**
 * Define the navigation items for the hackathon detail sidebar
 * These routes are relative to /dashboard/hackathon/[slug]
 */
const getOpportunityNavItems = (slug: string) => [
  {
    title: "Dashboard",
    url: `/dashboard/hackathon/${slug}`,
    icon: <Widget2 size={32} className="size-8" />,
  },
  {
    title: "Manage registration",
    url: `/dashboard/hackathon/${slug}/manage-registration`,
    icon: <Checklist size={32} className="size-8" />,
  },
  {
    title: "Edit Hackathon",
    url: `/dashboard/hackathon/${slug}/edit-hackathon`,
    icon: <Pen2 size={32} className="size-8" />,
  },
  {
    title: "Payments",
    url: `/dashboard/hackathon/${slug}/payments`,
    icon: <Card size={32} className="size-8" />,
  },
  {
    title: "Manage Roles",
    url: `/dashboard/hackathon/${slug}/manage-roles`,
    icon: <UserId size={32} className="size-8" />,
  },
  {
    title: "Send Notifications",
    url: `/dashboard/hackathon/${slug}/notifications`,
    icon: <NotificationUnreadLines size={32} className="size-8" />,
  },
  {
    title: "Settings",
    url: `/dashboard/hackathon/${slug}/settings`,
    icon: <Settings size={32} className="size-8" />,
  },
];

/**
 * OpportunitySidebar component for opportunity detail pages
 * Shows navigation specific to a single opportunity
 */
export function HackathonSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  // Get the slug from the URL params
  const params = useParams();
  const slug = params?.slug as string;

  // Generate navigation items with the current slug
  const navItems = React.useMemo(() => {
    return slug ? getOpportunityNavItems(slug) : [];
  }, [slug]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-neutral-300">
      <SidebarHeader className="border-b border-neutral-300">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="h-14 flex items-center justify-center">
              {state === "expanded" && (
                <p className="text-sm font-medium truncate">
                  {slug.toLocaleUpperCase() || "Details"}
                </p>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} showPill={true} />
      </SidebarContent>
      <SidebarFooter>
        <MobileSidebarSwitcher />
      </SidebarFooter>
    </Sidebar>
  );
}
