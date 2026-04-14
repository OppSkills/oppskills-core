"use client";

import * as React from "react";
import { Card, Checklist, NotificationUnreadLines, Pen2, Settings, UserId, Widget2 } from "@solar-icons/react";

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

const getEventNavItems = (slug: string) => [
  {
    title: "Dashboard",
    url: `/dashboard/events/${slug}`,
    icon: <Widget2 size={32} className="size-8" />,
  },
  {
    title: "Manage Registration",
    url: `/dashboard/events/${slug}/manage-registration`,
    icon: <Checklist size={32} className="size-8" />,
  },
  {
    title: "Edit Event",
    url: `/dashboard/events/${slug}/edit-event`,
    icon: <Pen2 size={32} className="size-8" />,
  },
  {
    title: "Payments",
    url: `/dashboard/events/${slug}/payments`,
    icon: <Card size={32} className="size-8" />,
  },
  // {
  //   title: "Tickets",
  //   url: `/dashboard/events/${slug}/tickets`,
  //   icon: <IconTicket size={32} className="size-8" />,
  // },
  {
    title: "Manage Roles",
    url: `/dashboard/events/${slug}/manage-roles`,
    icon: <UserId size={32} className="size-8" />,
  },
  {
    title: "Send Notifications",
    url: `/dashboard/events/${slug}/notifications`,
    icon: <NotificationUnreadLines size={32} className="size-8" />,
  },
  {
    title: "Settings",
    url: `/dashboard/events/${slug}/settings`,
    icon: <Settings size={32} className="size-8" />,
  },
];

interface EventsSidebarProps extends React.ComponentProps<typeof Sidebar> {
  slug: string;
}

export function EventsSidebar({ slug, ...props }: EventsSidebarProps) {
  const { state } = useSidebar();
  const navItems = React.useMemo(() => {
    return slug ? getEventNavItems(slug) : [];
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
