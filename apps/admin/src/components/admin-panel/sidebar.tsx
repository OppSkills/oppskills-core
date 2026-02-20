"use client"

import * as React from "react"
import {
    Calendar,
    Code,
    CreditCard,
    LayoutDashboard,
    Logs,
    Music,
    Shield,
    Users,
    ChevronRight,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

// This is sample data.
const data = {
    navMain: [
        {
            title: "Navigation",
            url: "#",
            items: [
                { name: "Dashboard", href: "/", icon: LayoutDashboard },
                { name: "Admins", href: "/admins", icon: Shield },
                { name: "Users", href: "/users", icon: Users },
                {
                    name: "Events & Activities",
                    icon: Calendar,
                    items: [
                        { name: "Events", href: "/events", icon: Calendar },
                        { name: "Hackathons", href: "/hackathons", icon: Code },
                        { name: "Festivals", href: "/festivals", icon: Music },
                    ]
                },
                { name: "Payments", href: "/payments", icon: CreditCard },
                { name: "Logs", href: "/logs", icon: Logs },
            ],
        },
    ],
}

import { UserNav } from "@/components/admin-panel/user-nav";
import Link from "next/link"


import { useRouter } from "next/navigation"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const { state } = useSidebar();
    const router = useRouter()

    // AuthContext handles the onboarding redirect now, so we can remove the local check.
    // However, if we need user data for other things in the sidebar, we can use useAuth().
    // For now, the global check in AuthContext is sufficient for the redirect.

    return (
        <Sidebar {...props} collapsible="icon">
            <SidebarHeader>
                <div className="flex h-16 items-center justify-center border-b px-2">
                    {state === "expanded" ? (
                        <img
                            src="/logo.svg"
                            alt="Logo"
                            className="h-10 w-auto object-contain transition-all duration-300"
                        />
                    ) : (
                        <img
                            src="/logof.png"
                            alt="Logo"
                            className="h-10 w-10 object-contain transition-all duration-300"
                        />
                    )}
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
                                        {item.items ? (
                                            <Collapsible defaultOpen className="group/collapsible">
                                                <CollapsibleTrigger asChild>
                                                    <SidebarMenuButton tooltip={item.name}>
                                                        {item.icon && <item.icon />}
                                                        <span>{item.name}</span>
                                                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                    </SidebarMenuButton>
                                                </CollapsibleTrigger>
                                                <CollapsibleContent>
                                                    <SidebarMenuSub>
                                                        {item.items.map((subItem) => (
                                                            <SidebarMenuSubItem key={subItem.name}>
                                                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                                                    <Link href={subItem.href}>
                                                                        {subItem.icon && <subItem.icon />}
                                                                        <span>{subItem.name}</span>
                                                                    </Link>
                                                                </SidebarMenuSubButton>
                                                            </SidebarMenuSubItem>
                                                        ))}
                                                    </SidebarMenuSub>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        ) : (
                                            <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.name}>
                                                <Link href={item.href}>
                                                    <item.icon />
                                                    <span className="font-medium">{item.name}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        )}
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <UserNav />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
