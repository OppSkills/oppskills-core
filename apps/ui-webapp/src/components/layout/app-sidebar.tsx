"use client";

import * as React from "react";

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
import { Confetti, Home, Rocket, Rocket2, UsersGroupTwoRounded, UserSpeak } from "@solar-icons/react";
import { NavUser } from "./nav-user";
import { usePathname } from "next/navigation";
import { User, Calendar, Trophy, Wallet } from "lucide-react";

const data = {
  navMain: [
    {
      title: "Home",
      url: "/dashboard",
      icon: <Home />,
    },
    {
      title: "Hackathons",
      url: "/dashboard/hackathon",
      icon: <Rocket />,
    },
    {
      title: "Events",
      url: "/dashboard/events",
      icon: <Rocket2 />,
    },
    {
      title: "Festivals",
      url: "/dashboard/festivals",
      icon: <Confetti />,
    },
    {
      title: "Manage Community",
      url: "/dashboard/community",
      icon: <UsersGroupTwoRounded />,
    },
  ],
  navProfile: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <Home />,
    },
    {
      title: "Profile",
      url: "/profile",
      icon: <User className="size-4" />,
    },
    {
      title: "Registrations",
      url: "/profile/registrations",
      icon: <Calendar className="size-4" />,
    },
    {
      title: "Achievements",
      url: "/profile/achievements",
      icon: <Trophy className="size-4" />,
    },
    {
      title: "Transactions",
      url: "/profile/transactions",
      icon: <Wallet className="size-4" />,
    },
    {
      title: "Referrals",
      url: "/profile/referrals",
      icon: <UserSpeak className="size-4" />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { isOpportunityDetail } = useMobileNavigation();
  const pathname = usePathname();

  const isProfile = pathname.startsWith("/profile");
  const items = isProfile ? data.navProfile : data.navMain;

  return (
    <Sidebar
      collapsible="icon"
      allowHoverExpand={true}
      {...props}
      className="border-neutral-300"
    >
      <SidebarHeader className="border-b h-14 flex items-center justify-center border-neutral-300">
        <SidebarMenu>
          <SidebarMenuItem className="flex justify-center">
            <SidebarMenuButton
              asChild
              className="hover:bg-transparent w-full group-data-[collapsible=icon]:p-0!"
            >
              <Link
                href="/"
                className="pl-4 group-data-[collapsible=icon]:p-0!"
              >
                <SidebarLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} showPill={true} />
      </SidebarContent>
      <SidebarFooter>
        {isOpportunityDetail && <MobileSidebarSwitcher />}
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function SidebarLogo() {
  const { state, isHovered } = useSidebar();
  const isVisualExpanded = state === "expanded" || isHovered;

  return (
    <>
      {isVisualExpanded ? (
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
