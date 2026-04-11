"use client";

import * as React from "react";
import {
  IconCalendarEvent,
  IconConfetti,
  IconDashboard,
  IconReport,
  IconUsers,
} from "@tabler/icons-react";

import { NavMain } from "./nav-main";
import { MobileSidebarSwitcher } from "./mobile-sidebar-switcher";
import { useMobileNavigation } from "./mobile-navigation-context";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import Link from "next/link";
import { Calendar } from "lucide-react";

const data = {
  navMain: [
    {
      title: "Dashboards",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Hackathons",
      url: "/dashboard/hackathon",
      icon: IconReport,
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: IconCalendarEvent,
    },
    {
      title: "Festivals",
      url: "/dashboard/festivals",
      icon: IconConfetti,
    },
    // {
    //   title: "Talent pipeline",
    //   url: "/dashboard/talent-pipeline",
    //   icon: IconUsers,
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isOpportunityDetail } = useMobileNavigation();
  return (
    <Sidebar collapsible="icon" {...props} className="">
      <SidebarHeader className="border-b pb-4">
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
                <SidebarLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      {isOpportunityDetail && (
        <SidebarFooter>
          <MobileSidebarSwitcher />
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

function SidebarLogo() {
  const { state } = useSidebar();

  return (
    <>
      {state === "expanded" ? (
        <Image
          src="/logo.svg"
          className="object-contain w-fit h-6"
          alt="OppSkills"
          width={100}
          height={24}
        />
      ) : (
        <Image
          src="/logof.png"
          className="object-contain w-6 h-6 mx-auto"
          alt="OppSkills"
          width={24}
          height={24}
        />
      )}
      <span className="text-base font-semibold sr-only">OppSkills</span>
    </>
  );
}
