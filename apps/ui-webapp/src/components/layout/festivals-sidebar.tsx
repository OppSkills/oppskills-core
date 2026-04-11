"use client";

import * as React from "react";
import {
    IconDashboard,
    IconPencil,
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

const getFestivalNavItems = (slug: string) => [
    {
        title: "Edit Festival",
        url: `/dashboard/festivals/${slug}/edit-festival`,
        icon: IconPencil,
    },
    {
        title: "Settings",
        url: `/dashboard/festivals/${slug}/settings`,
        icon: IconSettings,
    },
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
