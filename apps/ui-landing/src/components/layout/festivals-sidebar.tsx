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
} from "@/components/ui/sidebar";

const getFestivalNavItems = (slug: string) => [
    {
        title: "Dashboard",
        url: `/dashboard/festivals/${slug}`,
        icon: IconDashboard,
    },
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
    const navItems = React.useMemo(() => {
        return slug ? getFestivalNavItems(slug) : [];
    }, [slug]);

    return (
        <Sidebar collapsible="icon" {...props} className="">
            <SidebarHeader className="border-b border-border/50 pb-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <div className="px-2 py-3">
                            <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wide">
                                Festival
                            </h2>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                {slug || "Details"}
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
