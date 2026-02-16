"use client"

import * as React from "react"
import {
    Calendar,
    Code,
    CreditCard,
    LayoutDashboard,
    Music,
    Users,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

// This is sample data.
const data = {
    navMain: [
        {
            title: "Navigation",
            url: "#",
            items: [
                { name: "Dashboard", href: "/", icon: LayoutDashboard },
                { name: "Users", href: "/users", icon: Users },
                { name: "Events", href: "/events", icon: Calendar },
                { name: "Hackathons", href: "/hackathons", icon: Code },
                { name: "Festivals", href: "/festivals", icon: Music },
                { name: "Payments", href: "/payments", icon: CreditCard },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <div className="flex h-16 items-center border-b px-4">
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                </div>
            </SidebarHeader>
            <SidebarContent>
                {data.navMain.map((group) => (
                    <SidebarGroup key={group.title}>
                        <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {group.items.map((item) => (
                                    <SidebarMenuItem key={item.name}>
                                        <SidebarMenuButton asChild isActive={pathname === item.href}>
                                            <a href={item.href}>
                                                <item.icon />
                                                <span className="font-medium">{item.name}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarRail />
        </Sidebar>
    )
}
