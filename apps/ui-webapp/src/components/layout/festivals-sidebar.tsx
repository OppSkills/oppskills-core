"use client";

import * as React from "react";
import { Pen2, Settings, UserSpeak } from "@solar-icons/react";

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

const getFestivalNavItems = (slug: string) => [
    {
        title: "Edit Festival",
        url: `/dashboard/festivals/${slug}/edit-festival`,
        icon: <Pen2 className="size-4" />,
    },
    {
        title: "Settings",
        url: `/dashboard/festivals/${slug}/settings`,
        icon: <Settings className="size-4" />,
    },
    // {
    //     title: "Referrals",
    //     url: `/dashboard/festivals/${slug}/referrals`,
    //     icon: <UserSpeak className="size-4" />,
    // },
];

interface FestivalsSidebarProps extends React.ComponentProps<typeof Sidebar> {
    slug: string;
}

export function FestivalsSidebar({ slug, ...props }: FestivalsSidebarProps) {
    const { state } = useSidebar();
    const navItems = React.useMemo(() => {
        return slug ? getFestivalNavItems(slug) : [];
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
