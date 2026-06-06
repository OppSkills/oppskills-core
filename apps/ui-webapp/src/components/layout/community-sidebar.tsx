"use client";

import * as React from "react";
import {
  Widget2,
  Checklist,
  UserSpeak,
  NotificationUnreadLines,
} from "@solar-icons/react";

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

const getCommunityNavItems = (id: string) => [
  {
    title: "Stats",
    url: `/dashboard/community/manage/${id}`,
    icon: <Widget2 className="size-4" />,
  },
  // {
  //   title: "Community Goals",
  //   url: `/dashboard/community/manage/${id}/goals`,
  //   icon: <Checklist className="size-4" />,
  // },
  {
    title: "Referral",
    url: `/dashboard/community/manage/${id}/referral`,
    icon: <UserSpeak className="size-4" />,
  },
  {
    title: "Notification",
    url: `/dashboard/community/manage/${id}/notification`,
    icon: <NotificationUnreadLines className="size-4" />,
  },
];

interface CommunitySidebarProps extends React.ComponentProps<typeof Sidebar> {
  id: string;
}

export function CommunitySidebar({ id, ...props }: CommunitySidebarProps) {
  const { state } = useSidebar();

  const navItems = React.useMemo(() => {
    return id ? getCommunityNavItems(id) : [];
  }, [id]);

  return (
    <Sidebar collapsible="icon" {...props} className="border-neutral-300">
      <SidebarHeader className="border-b border-neutral-300">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="h-14 flex items-center justify-center">
              {state === "expanded" && (
                <p className="text-sm font-medium truncate uppercase">
                  Community Manage
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
