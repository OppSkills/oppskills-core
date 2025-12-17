"use client";

import * as React from "react";
import { IconDashboard, IconReport, IconUsers } from "@tabler/icons-react";

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

const data = {
  navMain: [
    {
      title: "Dashboards",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Opportunity",
      url: "/dashboard/opportunity",
      icon: IconReport,
    },
    {
      title: "Talent pipeline",
      url: "/dashboard/talent-pipeline",
      icon: IconUsers,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isOpportunityDetail } = useMobileNavigation();
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
          className="object-contain w-fit h-full"
          alt="OppSkills"
          width={100}
          height={100}
        />
      ) : (
        <Image
          src="/logof.png"
          className="object-contain w-8 h-8 mx-auto"
          alt="OppSkills"
          width={32}
          height={32}
        />
      )}
      <span className="text-base font-semibold sr-only">OppSkills</span>
    </>
  );
}
