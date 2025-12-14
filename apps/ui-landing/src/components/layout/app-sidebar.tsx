"use client";

import * as React from "react";
import { IconDashboard, IconReport, IconUsers } from "@tabler/icons-react";

import { NavMain } from "./nav-main";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";

const data = {
  navMain: [
    {
      title: "Dashboards",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Opportunity",
      url: "#",
      icon: IconReport,
    },
    {
      title: "Talent pipeline",
      url: "#",
      icon: IconUsers,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props} className="">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-2! h-14!"
            >
              <Link
                href="/"
                className="flex relative justify-start items-center gap-2 h-full p-2"
              >
                <Image
                  src="/logo.svg"
                  className="object-contain w-fit h-full"
                  alt="OppSkills"
                  width={100}
                  height={100}
                />
                <span className="text-base font-semibold sr-only">
                  OppSkills
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
    </Sidebar>
  );
}
