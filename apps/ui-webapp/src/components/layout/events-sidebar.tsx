"use client";

import * as React from "react";
import {
  IconDashboard,
  IconTicket,
  IconListCheck,
  IconPencil,
  IconUsers,
  IconBell,
  IconSettings,
  IconCreditCard,
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
} from "@/components/ui/sidebar";

const getEventNavItems = (slug: string) => [
  {
    title: "Dashboard",
    url: `/dashboard/events/${slug}`,
    icon: IconDashboard,
  },
  {
    title: "Manage Registration",
    url: `/dashboard/events/${slug}/manage-registration`,
    icon: IconListCheck,
  },
  {
    title: "Edit Event",
    url: `/dashboard/events/${slug}/edit-event`,
    icon: IconPencil,
  },
  {
    title: "Payments",
    url: `/dashboard/events/${slug}/payments`,
    icon: IconCreditCard,
  },
  // {
  //   title: "Tickets",
  //   url: `/dashboard/events/${slug}/tickets`,
  //   icon: IconTicket,
  // },
  {
    title: "Manage Roles",
    url: `/dashboard/events/${slug}/manage-roles`,
    icon: IconUsers,
  },
  {
    title: "Send Notifications",
    url: `/dashboard/events/${slug}/notifications`,
    icon: IconBell,
  },
  {
    title: "Settings",
    url: `/dashboard/events/${slug}/settings`,
    icon: IconSettings,
  },
];

interface EventsSidebarProps extends React.ComponentProps<typeof Sidebar> {
  slug: string;
}

export function EventsSidebar({ slug, ...props }: EventsSidebarProps) {
  const navItems = React.useMemo(() => {
    return slug ? getEventNavItems(slug) : [];
  }, [slug]);

  return (
    <Sidebar collapsible="icon" {...props} className="">
      <SidebarHeader className="border-b border-border/50 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="px-2 py-3">
              <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                Events
              </h2>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {slug || "Management"}
              </p>
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
