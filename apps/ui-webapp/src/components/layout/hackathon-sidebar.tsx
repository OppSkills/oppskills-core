"use client";

import * as React from "react";
import {
  IconUsers,
  IconDashboard,
  IconPencil,
  IconCreditCard,
  IconUserCog,
  IconMail,
  IconSettings,
} from "@tabler/icons-react";

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

/**
 * Define the navigation items for the hackathon detail sidebar
 * These routes are relative to /dashboard/hackathon/[slug]
 */
const getOpportunityNavItems = (slug: string) => [
  {
    title: "Dashboard",
    url: `/dashboard/hackathon/${slug}`,
    icon: IconDashboard,
  },
  {
    title: "Manage registration",
    url: `/dashboard/hackathon/${slug}/manage-registration`,
    icon: IconUsers,
  },
  {
    title: "Edit Hackathon",
    url: `/dashboard/hackathon/${slug}/edit-hackathon`,
    icon: IconPencil,
  },
  {
    title: "Payments",
    url: `/dashboard/hackathon/${slug}/payments`,
    icon: IconCreditCard,
  },
  {
    title: "Manage Roles",
    url: `/dashboard/hackathon/${slug}/manage-roles`,
    icon: IconUserCog,
  },
  {
    title: "Send Notifications",
    url: `/dashboard/hackathon/${slug}/notifications`,
    icon: IconMail,
  },
  {
    title: "Settings",
    url: `/dashboard/hackathon/${slug}/settings`,
    icon: IconSettings,
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
    <Sidebar collapsible="icon" {...props} className="">
      <SidebarHeader className="border-b border-border/50">
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
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <MobileSidebarSwitcher />
      </SidebarFooter>
    </Sidebar>
  );
}
