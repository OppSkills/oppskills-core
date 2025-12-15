"use client";

import * as React from "react";
import {
  IconHome,
  IconUsers,
  IconSettings,
  IconCalendarEvent,
  IconFileText,
} from "@tabler/icons-react";

import { NavMain } from "./nav-main";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { useParams } from "next/navigation";

/**
 * Define the navigation items for the opportunity detail sidebar
 * These routes are relative to /dashboard/opportunity/[slug]
 */
const getOpportunityNavItems = (slug: string) => [
  {
    title: "Overview",
    url: `/dashboard/opportunity/${slug}`,
    icon: IconHome,
  },
  {
    title: "Participants",
    url: `/dashboard/opportunity/${slug}/participants`,
    icon: IconUsers,
  },
  {
    title: "Registration",
    url: `/dashboard/opportunity/${slug}/manage-registration`,
    icon: IconCalendarEvent,
  },
  {
    title: "Content",
    url: `/dashboard/opportunity/${slug}/content`,
    icon: IconFileText,
  },
  {
    title: "Settings",
    url: `/dashboard/opportunity/${slug}/settings`,
    icon: IconSettings,
  },
];

/**
 * OpportunitySidebar component for opportunity detail pages
 * Shows navigation specific to a single opportunity
 */
export function OpportunitySidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  // Get the slug from the URL params
  const params = useParams();
  const slug = params?.slug as string;

  // Generate navigation items with the current slug
  const navItems = React.useMemo(() => {
    return slug ? getOpportunityNavItems(slug) : [];
  }, [slug]);

  return (
    <Sidebar collapsible="icon" {...props} className="">
      <SidebarHeader className="border-b border-border/50 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-3">
              <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                Opportunity
              </h2>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {slug || "Details"}
              </p>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
    </Sidebar>
  );
}
