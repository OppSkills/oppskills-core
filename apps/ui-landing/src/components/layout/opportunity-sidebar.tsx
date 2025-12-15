"use client";

import * as React from "react";
import {
  IconUsers,
  IconDashboard,
  IconPencil,
  IconCreditCard,
  IconUserCog,
  IconMail,
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
    title: "Dashboard",
    url: `/dashboard/opportunity/${slug}`,
    icon: IconDashboard,
  },
  {
    title: "Manage registration",
    url: `/dashboard/opportunity/${slug}/manage-registration`,
    icon: IconUsers,
  },
  {
    title: "Edit Opportunity",
    url: `/dashboard/opportunity/${slug}/edit-opportunity`,
    icon: IconPencil,
  },
  {
    title: "Payments",
    url: `/dashboard/opportunity/${slug}/payments`,
    icon: IconCreditCard,
  },
  {
    title: "Manage Roles",
    url: `/dashboard/opportunity/${slug}/manage-roles`,
    icon: IconUserCog,
  },
  {
    title: "Send Notifications",
    url: `/dashboard/opportunity/${slug}/send-notifications`,
    icon: IconMail,
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
