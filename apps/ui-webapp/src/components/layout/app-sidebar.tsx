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
import { Confetti, Home, Rocket, Rocket2, UsersGroupRounded } from "@solar-icons/react";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: <Home size={32} className="size-8" />,
    },
    {
      title: "Hackathons",
      url: "/dashboard/hackathon",
      icon: <Rocket size={32} className="size-8" />,
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: <Rocket2 size={32} className="size-8" />,
    },
    {
      title: "Festivals",
      url: "/dashboard/festivals",
      icon: <Confetti size={32} className="size-8" />,
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
    <Sidebar collapsible="icon" {...props} className="border-neutral-300">
      <SidebarHeader className="border-b h-14 flex items-center justify-center border-neutral-300">
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              asChild
              className="hover:bg-transparent w-full"
            >
              <Link
                href="/"
                className="pl-4"
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
    </>
  );
}
